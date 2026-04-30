import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Result, ok, err, ResultAsync } from 'neverthrow';
import { Webhook } from 'svix';
import { UserEntity, toUserDto, UserDto } from '../users/entities/user.entity';
import { TenantEntity, toTenantDto, TenantDto } from '../tenants/entities/tenant.entity';
import { MembershipEntity } from '../memberships/entities/membership.entity';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../audit/enums/audit-action.enum';
import { AuditTargetType } from '../audit/enums/audit-target.enum';
import { Role } from '../memberships/enums/role.enum';
import { Plan } from '../tenants/enums/plan.enum';
import { RedisService } from '../redis/redis.service';
import { CacheKey, CacheTTL } from '../redis/redis.types';
import {
  WebhookError,
  SyncError,
  DatabaseError,
  AuthError,
} from '../../common/errors/app.errors';
import { ClerkWebhookEvent } from './types/auth.types';

@Injectable()
export class AuthService {
  private readonly webhookSecret: string;

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    @InjectRepository(TenantEntity)
    private readonly tenantRepo: Repository<TenantEntity>,
    @InjectRepository(MembershipEntity)
    private readonly membershipRepo: Repository<MembershipEntity>,
    private readonly auditService: AuditService,
    private readonly redisService: RedisService,
    config: ConfigService,
  ) {
    this.webhookSecret = config.get<string>('clerk.webhookSecret', '');
  }

  verifyWebhook(
    payload: string,
    headers: Record<string, string>,
  ): Result<ClerkWebhookEvent, WebhookError> {
    return Result.fromThrowable(
      () => {
        const wh = new Webhook(this.webhookSecret);
        return wh.verify(payload, headers) as ClerkWebhookEvent;
      },
      (e) => new WebhookError('Clerk webhook verification failed', e),
    )();
  }

  async dispatchWebhookEvent(
    event: ClerkWebhookEvent,
    ip: string | null,
    ua: string | null,
  ): Promise<Result<{ action: string }, SyncError | DatabaseError>> {
    const { type, data } = event;
    switch (type) {
      case 'user.created':
      case 'user.updated':
        return (await this.syncClerkUser(data, ip, ua)).map(() => ({ action: type }));
      case 'organization.created':
        return (await this.provisionTenant(data, ip, ua)).map(() => ({ action: type }));
      case 'organizationMembership.created':
      case 'organizationMembership.updated':
        return (await this.syncMembership(data, ip, ua)).map(() => ({ action: type }));
      default:
        return ok({ action: `ignored:${type}` });
    }
  }

  async syncClerkUser(
    data: Record<string, unknown>,
    ip: string | null,
    ua: string | null,
  ): Promise<Result<UserDto, SyncError | DatabaseError>> {
    const clerkUserId = data['id'] as string;
    const emails = data['email_addresses'] as Array<Record<string, unknown>> | undefined;
    const email = emails?.[0]?.['email_address'] as string | undefined;

    if (!clerkUserId || !email) {
      return err(new SyncError('Missing clerkUserId or email in webhook data'));
    }

    const upsertResult = await ResultAsync.fromPromise(
      this.userRepo
        .createQueryBuilder()
        .insert()
        .into(UserEntity)
        .values({
          clerkUserId,
          email,
          name: ((data['first_name'] as string) ?? '') + ' ' + ((data['last_name'] as string) ?? ''),
          avatarUrl: (data['image_url'] as string) ?? null,
        })
        .orUpdate(['email', 'name', 'avatar_url'], ['clerk_user_id'])
        .returning('*')
        .execute(),
      (e) => new DatabaseError('Failed to upsert user', e),
    );

    if (upsertResult.isErr()) return err(upsertResult.error);

    const raw = upsertResult.value.raw as unknown[];
    if (!raw[0]) return err(new SyncError('Upsert returned no user'));
    const user = this.userRepo.create(raw[0] as Partial<UserEntity>);

    await this.auditService.log({
      tenantId: null,
      actorId: user.id,
      action: AuditAction.USER_CREATED,
      targetType: AuditTargetType.USER,
      targetId: user.id,
      metadata: { clerkUserId, email },
      ipAddress: ip,
      userAgent: ua,
    });

    return ok(toUserDto(user));
  }

  async provisionTenant(
    data: Record<string, unknown>,
    ip: string | null,
    ua: string | null,
  ): Promise<Result<TenantDto, SyncError | DatabaseError>> {
    const clerkOrgId = data['id'] as string;
    const name = (data['name'] as string) || 'Unnamed';
    const slug = (data['slug'] as string) || name.toLowerCase().replace(/\s+/g, '-');
    const schemaName = `tenant_${slug.replace(/[^a-z0-9_]/g, '_')}`;

    const saveResult = await ResultAsync.fromPromise(
      this.tenantRepo.save(
        this.tenantRepo.create({ clerkOrgId, schemaName, name, slug, plan: Plan.STARTER }),
      ),
      (e) => new DatabaseError('Failed to provision tenant', e),
    );

    if (saveResult.isErr()) return err(saveResult.error);
    const tenant = saveResult.value;

    await this.redisService.set(
      CacheKey.tenantResolve(clerkOrgId),
      { tenantId: tenant.id, schemaName: tenant.schemaName, plan: tenant.plan },
      CacheTTL.TENANT_RESOLVE,
    );

    await this.auditService.log({
      tenantId: tenant.id,
      actorId: null,
      action: AuditAction.TENANT_PROVISIONED,
      targetType: AuditTargetType.TENANT,
      targetId: tenant.id,
      metadata: { clerkOrgId, slug, schemaName },
      ipAddress: ip,
      userAgent: ua,
    });

    return ok(toTenantDto(tenant));
  }

  async syncMembership(
    data: Record<string, unknown>,
    ip: string | null,
    ua: string | null,
  ): Promise<Result<MembershipEntity, SyncError | DatabaseError>> {
    const orgData = data['organization'] as Record<string, unknown> | undefined;
    const userData = data['public_user_data'] as Record<string, unknown> | undefined;
    const clerkOrgId = orgData?.['id'] as string | undefined;
    const clerkUserId = userData?.['user_id'] as string | undefined;
    const rawRole = (data['role'] as string) ?? 'member';

    if (!clerkOrgId || !clerkUserId) {
      return err(new SyncError('Missing org or user in membership webhook'));
    }

    const roleMap: Record<string, Role> = {
      'org:admin': Role.ADMIN,
      'org:member': Role.MEMBER,
      admin: Role.ADMIN,
      member: Role.MEMBER,
    };
    const role = roleMap[rawRole] ?? Role.MEMBER;

    const tenant = await this.tenantRepo.findOne({ where: { clerkOrgId } });
    const user = await this.userRepo.findOne({ where: { clerkUserId } });
    if (!tenant || !user) {
      return err(new SyncError(`Tenant or user not found for membership sync (org=${clerkOrgId}, user=${clerkUserId})`));
    }

    const upsertResult = await ResultAsync.fromPromise(
      this.membershipRepo
        .createQueryBuilder()
        .insert()
        .into(MembershipEntity)
        .values({ userId: user.id, tenantId: tenant.id, role })
        .orUpdate(['role'], ['user_id', 'tenant_id'])
        .returning('*')
        .execute(),
      (e) => new DatabaseError('Failed to sync membership', e),
    );

    if (upsertResult.isErr()) return err(upsertResult.error);

    const raw = upsertResult.value.raw as unknown[];
    const membership = this.membershipRepo.create(raw[0] as Partial<MembershipEntity>);

    await this.redisService.del(CacheKey.userOrgs(user.id));

    await this.auditService.log({
      tenantId: tenant.id,
      actorId: user.id,
      action: AuditAction.ROLE_SYNCED,
      targetType: AuditTargetType.MEMBERSHIP,
      targetId: membership.id,
      metadata: { role, clerkOrgId, clerkUserId },
      ipAddress: ip,
      userAgent: ua,
    });

    return ok(membership);
  }
}
