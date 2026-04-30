import { Result } from 'neverthrow';
import { RedisError } from '../../common/errors/app.errors';
import { Plan } from '../tenants/enums/plan.enum';
import { Role } from '../memberships/enums/role.enum';

export interface TypedRedisClient {
  get<T>(key: string): Promise<Result<T | null, RedisError>>;
  set<T>(key: string, value: T, ttlSeconds: number): Promise<Result<void, RedisError>>;
  del(key: string): Promise<Result<void, RedisError>>;
  exists(key: string): Promise<Result<boolean, RedisError>>;
}

export const CacheKey = {
  tenantResolve: (clerkOrgId: string) => `tenant:resolve:${clerkOrgId}`,
  userOrgs: (userId: string) => `user:orgs:${userId}`,
  session: (sessionId: string) => `session:${sessionId}`,
} as const;

export const CacheTTL = {
  TENANT_RESOLVE: 3600,
  USER_ORGS: 1800,
  SESSION: 900,
} as const;

export interface TenantCacheValue {
  tenantId: string;
  schemaName: string;
  plan: Plan;
}

export interface OrgMembership {
  tenantId: string;
  role: Role;
  tenantName: string;
  tenantSlug: string;
}
