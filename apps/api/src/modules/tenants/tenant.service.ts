import { Injectable } from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Result, ResultAsync, ok, err } from 'neverthrow';
import { TenantEntity, TenantDto, toTenantDto } from './entities/tenant.entity';
import { MembershipEntity } from '../memberships/entities/membership.entity';
import { RedisService } from '../redis/redis.service';
import { AuditService } from '../audit/audit.service';
import { CacheKey, CacheTTL, TenantCacheValue, OrgMembership } from '../redis/redis.types';
import { DatabaseError, NotFoundError, AuthError } from '../../common/errors/app.errors';
import { AuditAction } from '../audit/enums/audit-action.enum';
import { AuditTargetType } from '../audit/enums/audit-target.enum';
import { Plan } from './enums/plan.enum';

const TENANT_SCHEMA_DDL = `
  CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    short_code VARCHAR(10) NOT NULL,
    description TEXT,
    color VARCHAR(7) NOT NULL DEFAULT '#7c3aed',
    icon VARCHAR(50) NOT NULL DEFAULT 'FolderOutlined',
    archived_at TIMESTAMPTZ,
    created_by UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS sprints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    goal TEXT,
    starts_at TIMESTAMPTZ,
    ends_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    sprint_id UUID REFERENCES sprints(id) ON DELETE SET NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'backlog',
    priority VARCHAR(20) NOT NULL DEFAULT 'medium',
    assignee_id UUID,
    reporter_id UUID NOT NULL,
    due_date TIMESTAMPTZ,
    labels TEXT[] NOT NULL DEFAULT '{}',
    position INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    author_id UUID NOT NULL,
    body TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID,
    action VARCHAR(100) NOT NULL,
    target_type VARCHAR(50) NOT NULL,
    target_id UUID,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'system',
    title VARCHAR(255) NOT NULL,
    body TEXT,
    resource_type VARCHAR(50),
    resource_id UUID,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    category VARCHAR(50) NOT NULL,
    email_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    in_app_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    quiet_hours_start VARCHAR(5),
    quiet_hours_end VARCHAR(5),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, category)
  );

  CREATE TABLE IF NOT EXISTS issues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    sprint_id UUID REFERENCES sprints(id) ON DELETE SET NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    type VARCHAR(20) NOT NULL DEFAULT 'TASK',
    severity VARCHAR(20),
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN',
    priority VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
    assignee_id UUID,
    rank DOUBLE PRECISION NOT NULL DEFAULT 0,
    reported_by_user_id UUID NOT NULL,
    steps_to_reproduce TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  ALTER TABLE sprints ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'PLANNED';
  ALTER TABLE sprints ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ;

  CREATE TABLE IF NOT EXISTS members_cache (
    user_id UUID PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    avatar_url TEXT,
    role VARCHAR(20) NOT NULL,
    synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
  CREATE INDEX IF NOT EXISTS idx_tasks_project_status ON tasks(project_id, status);
  CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks(assignee_id);
  CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
  CREATE INDEX IF NOT EXISTS idx_tasks_sprint ON tasks(sprint_id);
  CREATE INDEX IF NOT EXISTS idx_comments_task ON comments(task_id);
  CREATE INDEX IF NOT EXISTS idx_activity_target ON activity_logs(target_type, target_id);
  CREATE INDEX IF NOT EXISTS idx_activity_entity_created ON activity_logs(target_id, created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_notif_user_read ON notifications(user_id, read_at, created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_notif_unread ON notifications(user_id) WHERE read_at IS NULL;
  CREATE INDEX IF NOT EXISTS idx_issues_project_type_status ON issues(project_id, type, status);
  CREATE INDEX IF NOT EXISTS idx_issues_sprint_rank ON issues(sprint_id, rank);
  CREATE INDEX IF NOT EXISTS idx_issues_severity ON issues(severity, status, created_at DESC);
  CREATE UNIQUE INDEX IF NOT EXISTS idx_one_active_sprint ON sprints(project_id) WHERE status = 'ACTIVE';
  CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
  CREATE INDEX IF NOT EXISTS idx_sprints_project ON sprints(project_id);
`;

export interface OrgWithRole {
  tenantId: string;
  name: string;
  slug: string;
  plan: Plan;
  role: string;
  schemaName: string;
}

@Injectable()
export class TenantService {
  constructor(
    @InjectRepository(TenantEntity)
    private readonly tenantRepo: Repository<TenantEntity>,
    @InjectRepository(MembershipEntity)
    private readonly membershipRepo: Repository<MembershipEntity>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly redis: RedisService,
    private readonly audit: AuditService,
  ) {}

  /** Resolve tenant from clerkOrgId — cache-first, DB fallback */
  async resolve(clerkOrgId: string): Promise<Result<TenantCacheValue, NotFoundError | DatabaseError>> {
    const cacheKey = CacheKey.tenantResolve(clerkOrgId);
    const cached = await this.redis.get<TenantCacheValue>(cacheKey);
    if (cached.isOk() && cached.value !== null) {
      return ok(cached.value);
    }

    const tenantResult = await ResultAsync.fromPromise(
      this.tenantRepo.findOne({ where: { clerkOrgId } }),
      (e) => new DatabaseError('Failed to resolve tenant', e),
    );

    if (tenantResult.isErr()) return err(tenantResult.error);
    if (!tenantResult.value) return err(new NotFoundError(`Tenant not found for org ${clerkOrgId}`));

    const tenant = tenantResult.value;
    const value: TenantCacheValue = {
      tenantId: tenant.id,
      schemaName: tenant.schemaName,
      plan: tenant.plan,
    };

    await this.redis.set(cacheKey, value, CacheTTL.TENANT_RESOLVE);
    return ok(value);
  }

  /** Create the PostgreSQL schema for a tenant and run DDL */
  async createSchema(tenantId: string): Promise<Result<void, DatabaseError>> {
    const tenantResult = await ResultAsync.fromPromise(
      this.tenantRepo.findOne({ where: { id: tenantId } }),
      (e) => new DatabaseError('Failed to load tenant for schema creation', e),
    );

    if (tenantResult.isErr()) return err(tenantResult.error);
    if (!tenantResult.value) return err(new DatabaseError('Tenant not found'));

    const schemaName = tenantResult.value.schemaName;

    // Validate schema name: only lowercase letters, digits, underscores
    if (!/^[a-z][a-z0-9_]{0,62}$/.test(schemaName)) {
      return err(new DatabaseError(`Invalid schema name: ${schemaName}`));
    }

    const qr = this.dataSource.createQueryRunner();
    await qr.connect();

    const createResult = await ResultAsync.fromPromise(
      (async () => {
        // Schema name is validated above — safe to interpolate
        await qr.query(`CREATE SCHEMA IF NOT EXISTS "${schemaName}"`);
        await qr.query(`SET search_path TO "${schemaName}"`);
        await qr.query(TENANT_SCHEMA_DDL);
        await qr.query(`SET search_path TO public`);
      })(),
      (e) => new DatabaseError(`Failed to create schema "${schemaName}"`, e),
    );

    await qr.release();

    if (createResult.isOk()) {
      await this.audit.log({
        tenantId,
        actorId: null,
        action: AuditAction.TENANT_PROVISIONED,
        targetType: AuditTargetType.TENANT,
        targetId: tenantId,
        metadata: { schemaName },
        ipAddress: null,
        userAgent: null,
      });
    }

    return createResult;
  }

  /** GET /orgs/mine — return user's orgs from cache or DB */
  async getUserOrgs(clerkUserId: string): Promise<Result<OrgWithRole[], DatabaseError>> {
    const cacheKey = CacheKey.userOrgs(clerkUserId);
    const cached = await this.redis.get<OrgWithRole[]>(cacheKey);
    if (cached.isOk() && cached.value !== null) {
      return ok(cached.value);
    }

    const result = await ResultAsync.fromPromise(
      this.membershipRepo
        .createQueryBuilder('m')
        .innerJoinAndSelect('m.tenant', 't')
        .innerJoin('m.user', 'u')
        .where('u.clerkUserId = :clerkUserId', { clerkUserId })
        .getMany(),
      (e) => new DatabaseError('Failed to fetch user orgs', e),
    );

    if (result.isErr()) return err(result.error);

    const orgs: OrgWithRole[] = result.value.map((m) => ({
      tenantId: m.tenant.id,
      name: m.tenant.name,
      slug: m.tenant.slug,
      plan: m.tenant.plan,
      role: m.role,
      schemaName: m.tenant.schemaName,
    }));

    await this.redis.set(cacheKey, orgs, CacheTTL.USER_ORGS);
    return ok(orgs);
  }

  /** Validate that a user has membership in a tenant */
  async validateMembership(
    clerkUserId: string,
    tenantId: string,
  ): Promise<Result<MembershipEntity, NotFoundError | DatabaseError>> {
    const result = await ResultAsync.fromPromise(
      this.membershipRepo
        .createQueryBuilder('m')
        .innerJoin('m.user', 'u')
        .where('u.clerkUserId = :clerkUserId', { clerkUserId })
        .andWhere('m.tenantId = :tenantId', { tenantId })
        .getOne(),
      (e) => new DatabaseError('Failed to validate membership', e),
    );

    if (result.isErr()) return err(result.error);
    if (!result.value) return err(new NotFoundError('Not a member of this organization'));

    return ok(result.value);
  }

  /** Set search_path for the current connection to a tenant schema */
  async setSearchPath(schemaName: string): Promise<Result<void, DatabaseError>> {
    if (!/^[a-z][a-z0-9_]{0,62}$/.test(schemaName)) {
      return err(new DatabaseError(`Invalid schema name: ${schemaName}`));
    }

    return ResultAsync.fromPromise(
      this.dataSource.query(`SET search_path TO "${schemaName}", public`),
      (e) => new DatabaseError(`Failed to set search_path to "${schemaName}"`, e),
    );
  }
}
