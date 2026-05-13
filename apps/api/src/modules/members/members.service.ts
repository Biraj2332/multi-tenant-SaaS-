import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Result, ok, err, ResultAsync } from 'neverthrow';
import { MemberError, NotFoundError, DatabaseError } from '../../common/errors/app.errors';
import { MembershipEntity } from '../memberships/entities/membership.entity';
import { Role } from '../memberships/enums/role.enum';
import { UserEntity } from '../users/entities/user.entity';
import { RedisService } from '../redis/redis.service';
import { CacheKey } from '../redis/redis.types';

export interface MemberInfo {
  userId: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  role: Role;
  joinedAt: Date;
}

const ROLE_LEVEL: Record<Role, number> = {
  [Role.OWNER]: 40,
  [Role.ADMIN]: 30,
  [Role.MEMBER]: 20,
  [Role.VIEWER]: 10,
};

@Injectable()
export class MembersService {
  constructor(
    @InjectRepository(MembershipEntity) private readonly memberRepo: Repository<MembershipEntity>,
    @InjectRepository(UserEntity) private readonly userRepo: Repository<UserEntity>,
    private readonly redis: RedisService,
  ) {}

  async listByTenant(tenantId: string): Promise<Result<MemberInfo[], DatabaseError>> {
    return ResultAsync.fromPromise(
      this.memberRepo.find({ where: { tenantId }, relations: ['user'], order: { joinedAt: 'ASC' } }),
      (e) => new DatabaseError('Failed to list members', e),
    ).map((rows) =>
      rows.map((m) => ({
        userId: m.userId,
        email: m.user?.email ?? '',
        name: m.user?.name ?? null,
        avatarUrl: m.user?.avatarUrl ?? null,
        role: m.role,
        joinedAt: m.joinedAt,
      })),
    );
  }

  async changeRole(
    tenantId: string,
    actorClerkId: string,
    actorRole: Role,
    targetUserId: string,
    newRole: Role,
  ): Promise<Result<MembershipEntity, MemberError | NotFoundError | DatabaseError>> {
    // Lookup actor membership
    const actorUserResult = await ResultAsync.fromPromise(
      this.userRepo.findOne({ where: { clerkUserId: actorClerkId } }),
      (e) => new DatabaseError('Failed to load actor', e),
    );
    if (actorUserResult.isErr()) return err(actorUserResult.error);
    if (!actorUserResult.value) return err(new NotFoundError('Actor user not found'));
    if (actorUserResult.value.id === targetUserId) {
      return err(new MemberError('You cannot change your own role'));
    }

    const targetResult = await ResultAsync.fromPromise(
      this.memberRepo.findOne({ where: { tenantId, userId: targetUserId } }),
      (e) => new DatabaseError('Failed to load target member', e),
    );
    if (targetResult.isErr()) return err(targetResult.error);
    if (!targetResult.value) return err(new NotFoundError('Member not found'));
    const target = targetResult.value;

    // Cannot set role >= your own (unless you're OWNER)
    if (actorRole !== Role.OWNER && ROLE_LEVEL[newRole] >= ROLE_LEVEL[actorRole]) {
      return err(new MemberError('Cannot assign role equal to or higher than your own'));
    }
    // ADMIN cannot change another ADMIN/OWNER
    if (actorRole === Role.ADMIN && ROLE_LEVEL[target.role] >= ROLE_LEVEL[Role.ADMIN]) {
      return err(new MemberError('Admins cannot modify peers or owners'));
    }

    target.role = newRole;
    const saved = await ResultAsync.fromPromise(
      this.memberRepo.save(target),
      (e) => new DatabaseError('Failed to save role change', e),
    );
    if (saved.isErr()) return err(saved.error);
    await this.redis.del(CacheKey.userOrgs(targetUserId));
    await this.redis.del(CacheKey.rbac(tenantId, targetUserId));
    return ok(saved.value);
  }

  async remove(
    tenantId: string,
    actorClerkId: string,
    actorRole: Role,
    targetUserId: string,
  ): Promise<Result<void, MemberError | NotFoundError | DatabaseError>> {
    const actorUserResult = await ResultAsync.fromPromise(
      this.userRepo.findOne({ where: { clerkUserId: actorClerkId } }),
      (e) => new DatabaseError('Failed to load actor', e),
    );
    if (actorUserResult.isErr()) return err(actorUserResult.error);
    if (actorUserResult.value && actorUserResult.value.id === targetUserId) {
      return err(new MemberError('You cannot remove yourself'));
    }

    const targetResult = await ResultAsync.fromPromise(
      this.memberRepo.findOne({ where: { tenantId, userId: targetUserId } }),
      (e) => new DatabaseError('Failed to load member', e),
    );
    if (targetResult.isErr()) return err(targetResult.error);
    if (!targetResult.value) return err(new NotFoundError('Member not found'));
    const target = targetResult.value;

    if (target.role === Role.OWNER) {
      const ownerCount = await this.memberRepo.count({ where: { tenantId, role: Role.OWNER } });
      if (ownerCount <= 1) {
        return err(new MemberError('Cannot remove the sole owner'));
      }
    }
    if (actorRole === Role.ADMIN && ROLE_LEVEL[target.role] >= ROLE_LEVEL[Role.ADMIN]) {
      return err(new MemberError('Admins cannot remove peers or owners'));
    }

    const removed = await ResultAsync.fromPromise(
      this.memberRepo.delete({ tenantId, userId: targetUserId }).then(() => undefined),
      (e) => new DatabaseError('Failed to delete member', e),
    );
    if (removed.isErr()) return err(removed.error);
    await this.redis.del(CacheKey.userOrgs(targetUserId));
    await this.redis.del(CacheKey.rbac(tenantId, targetUserId));
    return ok(undefined);
  }
}
