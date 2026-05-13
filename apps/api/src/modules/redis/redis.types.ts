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
  project: (tenantId: string, projectId: string) => `project:${tenantId}:${projectId}`,
  projectList: (tenantId: string) => `projects:${tenantId}`,
  taskList: (tenantId: string, projectId: string, filter: string) => `tasks:${tenantId}:${projectId}:${filter}`,
  rbac: (tenantId: string, userId: string) => `rbac:${tenantId}:${userId}`,
  sprintActive: (tenantId: string, projectId: string) => `sprint:active:${tenantId}:${projectId}`,
  sprints: (tenantId: string, projectId: string) => `sprints:${tenantId}:${projectId}`,
  issues: (tenantId: string, filterHash: string) => `issues:${tenantId}:${filterHash}`,
  unreadCount: (tenantId: string, userId: string) => `unread_count:${tenantId}:${userId}`,
  notifPrefs: (tenantId: string, userId: string) => `notif_prefs:${tenantId}:${userId}`,
  analytics: (tenantId: string, queryHash: string) => `analytics:${tenantId}:${queryHash}`,
  metricSummary: (tenantId: string) => `metric_summary:${tenantId}`,
  rateLimit: (tenantId: string) => `rate:${tenantId}`,
} as const;

export const CacheTTL = {
  TENANT_RESOLVE: 3600,
  USER_ORGS: 1800,
  SESSION: 900,
  PROJECT: 600,
  PROJECT_LIST: 600,
  TASK_LIST: 120,
  RBAC: 1800,
  SPRINT_ACTIVE: 3600,
  SPRINTS: 300,
  ISSUES: 120,
  UNREAD_COUNT: 60,
  NOTIF_PREFS: 3600,
  ANALYTICS: 300,
  METRIC_SUMMARY: 120,
} as const;

export interface RbacEntry {
  role: string;
  permissions: string[];
}

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
