import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Result, ok } from 'neverthrow';
import { DatabaseError } from '../../common/errors/app.errors';
import { withTenantSchemaResult } from '../../common/helpers/tenant-query';
import { RedisService } from '../redis/redis.service';
import { CacheKey, CacheTTL } from '../redis/redis.types';

export interface MetricSummary {
  totalProjects: number;
  totalTasks: number;
  doneTasks: number;
  openBugs: number;
  activeSprintCount: number;
}

export interface TaskTrendPoint { date: string; created: number; completed: number; }
export interface PriorityDist { priority: string; count: number; }
export interface VelocityPoint { sprint: string; completed: number; }

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectDataSource() private readonly ds: DataSource,
    private readonly redis: RedisService,
  ) {}

  async summary(
    schemaName: string,
    tenantId: string,
  ): Promise<Result<MetricSummary, DatabaseError>> {
    const key = CacheKey.metricSummary(tenantId);
    const cached = await this.redis.get<MetricSummary>(key);
    if (cached.isOk() && cached.value !== null) return ok(cached.value);

    const result = await withTenantSchemaResult(this.ds, schemaName, async (qr) => {
      const rows: Array<{
        total_projects: string;
        total_tasks: string;
        done_tasks: string;
        open_bugs: string;
        active_sprints: string;
      }> = await qr.query(`
        SELECT
          (SELECT COUNT(*) FROM projects WHERE archived_at IS NULL)::text AS total_projects,
          (SELECT COUNT(*) FROM tasks)::text AS total_tasks,
          (SELECT COUNT(*) FROM tasks WHERE status = 'done')::text AS done_tasks,
          (SELECT COUNT(*) FROM issues WHERE type = 'BUG' AND status NOT IN ('RESOLVED','CLOSED'))::text AS open_bugs,
          (SELECT COUNT(*) FROM sprints WHERE status = 'ACTIVE')::text AS active_sprints
      `);
      const r = rows[0];
      return {
        totalProjects: Number(r?.total_projects ?? 0),
        totalTasks: Number(r?.total_tasks ?? 0),
        doneTasks: Number(r?.done_tasks ?? 0),
        openBugs: Number(r?.open_bugs ?? 0),
        activeSprintCount: Number(r?.active_sprints ?? 0),
      };
    });

    if (result.isOk()) await this.redis.set(key, result.value, CacheTTL.METRIC_SUMMARY);
    return result;
  }

  async taskTrend(
    schemaName: string,
    tenantId: string,
    days = 30,
  ): Promise<Result<TaskTrendPoint[], DatabaseError>> {
    const key = CacheKey.analytics(tenantId, `trend:${days}`);
    const cached = await this.redis.get<TaskTrendPoint[]>(key);
    if (cached.isOk() && cached.value !== null) return ok(cached.value);

    const result = await withTenantSchemaResult(this.ds, schemaName, async (qr) => {
      const rows: Array<{ date: string; created: string; completed: string }> = await qr.query(`
        WITH days AS (
          SELECT generate_series(CURRENT_DATE - ($1::int - 1), CURRENT_DATE, '1 day'::interval)::date AS day
        )
        SELECT
          to_char(d.day, 'YYYY-MM-DD') AS date,
          COALESCE(SUM(CASE WHEN DATE(t.created_at) = d.day THEN 1 ELSE 0 END), 0)::text AS created,
          COALESCE(SUM(CASE WHEN t.status = 'done' AND DATE(t.updated_at) = d.day THEN 1 ELSE 0 END), 0)::text AS completed
        FROM days d
        LEFT JOIN tasks t ON DATE(t.created_at) = d.day OR (t.status = 'done' AND DATE(t.updated_at) = d.day)
        GROUP BY d.day
        ORDER BY d.day ASC
      `, [days]);
      return rows.map((r) => ({
        date: r.date,
        created: Number(r.created),
        completed: Number(r.completed),
      }));
    });

    if (result.isOk()) await this.redis.set(key, result.value, CacheTTL.ANALYTICS);
    return result;
  }

  async priorityDistribution(
    schemaName: string,
    tenantId: string,
  ): Promise<Result<PriorityDist[], DatabaseError>> {
    const key = CacheKey.analytics(tenantId, 'priority-dist');
    const cached = await this.redis.get<PriorityDist[]>(key);
    if (cached.isOk() && cached.value !== null) return ok(cached.value);

    const result = await withTenantSchemaResult(this.ds, schemaName, async (qr) => {
      const rows: Array<{ priority: string; count: string }> = await qr.query(`
        SELECT priority, COUNT(*)::text AS count
        FROM tasks WHERE status != 'done'
        GROUP BY priority ORDER BY count DESC
      `);
      return rows.map((r) => ({ priority: r.priority, count: Number(r.count) }));
    });

    if (result.isOk()) await this.redis.set(key, result.value, CacheTTL.ANALYTICS);
    return result;
  }

  async sprintVelocity(
    schemaName: string,
    tenantId: string,
  ): Promise<Result<VelocityPoint[], DatabaseError>> {
    const key = CacheKey.analytics(tenantId, 'velocity');
    const cached = await this.redis.get<VelocityPoint[]>(key);
    if (cached.isOk() && cached.value !== null) return ok(cached.value);

    const result = await withTenantSchemaResult(this.ds, schemaName, async (qr) => {
      const rows: Array<{ sprint: string; completed: string }> = await qr.query(`
        SELECT s.name AS sprint,
          COALESCE(SUM(CASE WHEN t.status = 'done' THEN 1 ELSE 0 END), 0)::text AS completed
        FROM sprints s
        LEFT JOIN tasks t ON t.sprint_id = s.id
        WHERE s.status = 'COMPLETED'
        GROUP BY s.id, s.name, s.completed_at
        ORDER BY s.completed_at DESC NULLS LAST
        LIMIT 10
      `);
      return rows.map((r) => ({ sprint: r.sprint, completed: Number(r.completed) })).reverse();
    });

    if (result.isOk()) await this.redis.set(key, result.value, CacheTTL.ANALYTICS);
    return result;
  }
}
