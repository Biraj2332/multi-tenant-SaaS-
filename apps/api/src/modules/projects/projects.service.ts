import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Result, ok, err } from 'neverthrow';
import { RedisService } from '../redis/redis.service';
import { CacheKey, CacheTTL } from '../redis/redis.types';
import { DatabaseError, NotFoundError } from '../../common/errors/app.errors';
import { withTenantSchemaResult } from '../../common/helpers/tenant-query';

export interface ProjectRow {
  id: string;
  name: string;
  short_code: string;
  description: string | null;
  color: string;
  icon: string;
  archived_at: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectWithProgress extends ProjectRow {
  total_tasks: number;
  done_tasks: number;
  progress: number;
}

export interface CreateProjectDto {
  name: string;
  shortCode: string;
  description?: string;
  color?: string;
  icon?: string;
}

export interface UpdateProjectDto {
  name?: string;
  description?: string;
  color?: string;
  icon?: string;
}

@Injectable()
export class ProjectsService {
  constructor(
    @InjectDataSource() private readonly ds: DataSource,
    private readonly redis: RedisService,
  ) {}

  async findAll(
    schemaName: string,
    tenantId: string,
  ): Promise<Result<ProjectWithProgress[], DatabaseError>> {
    // Check cache first
    const cacheKey = CacheKey.projectList(tenantId);
    const cached = await this.redis.get<ProjectWithProgress[]>(cacheKey);
    if (cached.isOk() && cached.value !== null) return ok(cached.value);

    const result = await withTenantSchemaResult(this.ds, schemaName, async (qr) => {
      const rows: ProjectWithProgress[] = await qr.query(`
        SELECT p.*,
          COALESCE(tc.total, 0)::int AS total_tasks,
          COALESCE(tc.done, 0)::int  AS done_tasks,
          CASE WHEN COALESCE(tc.total, 0) = 0 THEN 0
               ELSE ROUND(COALESCE(tc.done, 0)::numeric / tc.total * 100)::int
          END AS progress
        FROM projects p
        LEFT JOIN LATERAL (
          SELECT COUNT(*)::int AS total,
                 COUNT(*) FILTER (WHERE status = 'done')::int AS done
          FROM tasks t WHERE t.project_id = p.id
        ) tc ON true
        WHERE p.archived_at IS NULL
        ORDER BY p.created_at DESC
      `);
      return rows;
    });

    if (result.isOk()) {
      await this.redis.set(cacheKey, result.value, CacheTTL.PROJECT_LIST);
    }
    return result;
  }

  async findOne(
    schemaName: string,
    tenantId: string,
    projectId: string,
  ): Promise<Result<ProjectWithProgress, NotFoundError | DatabaseError>> {
    const cacheKey = CacheKey.project(tenantId, projectId);
    const cached = await this.redis.get<ProjectWithProgress>(cacheKey);
    if (cached.isOk() && cached.value !== null) return ok(cached.value);

    const result = await withTenantSchemaResult(this.ds, schemaName, async (qr) => {
      const rows: ProjectWithProgress[] = await qr.query(
        `
        SELECT p.*,
          COALESCE(tc.total, 0)::int AS total_tasks,
          COALESCE(tc.done, 0)::int  AS done_tasks,
          CASE WHEN COALESCE(tc.total, 0) = 0 THEN 0
               ELSE ROUND(COALESCE(tc.done, 0)::numeric / tc.total * 100)::int
          END AS progress
        FROM projects p
        LEFT JOIN LATERAL (
          SELECT COUNT(*)::int AS total,
                 COUNT(*) FILTER (WHERE status = 'done')::int AS done
          FROM tasks t WHERE t.project_id = p.id
        ) tc ON true
        WHERE p.id = $1
      `,
        [projectId],
      );
      return rows[0] ?? null;
    });

    if (result.isErr()) return err(result.error);
    if (!result.value) return err(new NotFoundError(`Project ${projectId} not found`));

    await this.redis.set(CacheKey.project(tenantId, projectId), result.value, CacheTTL.PROJECT);
    return ok(result.value);
  }

  async create(
    schemaName: string,
    tenantId: string,
    dto: CreateProjectDto,
    createdBy: string,
  ): Promise<Result<ProjectRow, DatabaseError>> {
    const result = await withTenantSchemaResult(this.ds, schemaName, async (qr) => {
      const rows: ProjectRow[] = await qr.query(
        `INSERT INTO projects (name, short_code, description, color, icon, created_by)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [
          dto.name,
          dto.shortCode,
          dto.description ?? null,
          dto.color ?? '#7c3aed',
          dto.icon ?? 'FolderOutlined',
          createdBy,
        ],
      );
      return rows[0];
    });

    if (result.isOk()) {
      await this.invalidateProjectCache(tenantId);
    }
    return result;
  }

  async update(
    schemaName: string,
    tenantId: string,
    projectId: string,
    dto: UpdateProjectDto,
  ): Promise<Result<ProjectRow, NotFoundError | DatabaseError>> {
    const sets: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    if (dto.name !== undefined) { sets.push(`name = $${idx++}`); params.push(dto.name); }
    if (dto.description !== undefined) { sets.push(`description = $${idx++}`); params.push(dto.description); }
    if (dto.color !== undefined) { sets.push(`color = $${idx++}`); params.push(dto.color); }
    if (dto.icon !== undefined) { sets.push(`icon = $${idx++}`); params.push(dto.icon); }

    if (sets.length === 0) return err(new DatabaseError('Nothing to update'));

    sets.push(`updated_at = NOW()`);
    params.push(projectId);

    const result = await withTenantSchemaResult(this.ds, schemaName, async (qr) => {
      const rows: ProjectRow[] = await qr.query(
        `UPDATE projects SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`,
        params,
      );
      return rows[0] ?? null;
    });

    if (result.isErr()) return err(result.error);
    if (!result.value) return err(new NotFoundError(`Project ${projectId} not found`));

    await this.invalidateProjectCache(tenantId, projectId);
    return ok(result.value);
  }

  async archive(
    schemaName: string,
    tenantId: string,
    projectId: string,
  ): Promise<Result<ProjectRow, NotFoundError | DatabaseError>> {
    const result = await withTenantSchemaResult(this.ds, schemaName, async (qr) => {
      const rows: ProjectRow[] = await qr.query(
        `UPDATE projects SET archived_at = NOW(), updated_at = NOW() WHERE id = $1 RETURNING *`,
        [projectId],
      );
      return rows[0] ?? null;
    });

    if (result.isErr()) return err(result.error);
    if (!result.value) return err(new NotFoundError(`Project ${projectId} not found`));

    await this.invalidateProjectCache(tenantId, projectId);
    return ok(result.value);
  }

  async remove(
    schemaName: string,
    tenantId: string,
    projectId: string,
  ): Promise<Result<void, DatabaseError>> {
    const result = await withTenantSchemaResult(this.ds, schemaName, async (qr) => {
      await qr.query(`DELETE FROM projects WHERE id = $1`, [projectId]);
    });

    if (result.isOk()) {
      await this.invalidateProjectCache(tenantId, projectId);
    }
    return result;
  }

  async invalidateProjectCache(tenantId: string, projectId?: string): Promise<void> {
    await this.redis.del(CacheKey.projectList(tenantId));
    if (projectId) await this.redis.del(CacheKey.project(tenantId, projectId));
  }
}
