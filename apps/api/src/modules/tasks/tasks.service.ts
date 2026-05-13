import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Result, ok, err } from 'neverthrow';
import { RedisService } from '../redis/redis.service';
import { CacheKey, CacheTTL } from '../redis/redis.types';
import { DatabaseError, NotFoundError } from '../../common/errors/app.errors';
import { withTenantSchemaResult } from '../../common/helpers/tenant-query';
import { ProjectsService } from '../projects/projects.service';

export interface TaskRow {
  id: string;
  project_id: string;
  sprint_id: string | null;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  assignee_id: string | null;
  reporter_id: string;
  due_date: string | null;
  labels: string[];
  position: number;
  created_at: string;
  updated_at: string;
}

export interface CreateTaskDto {
  projectId: string;
  title: string;
  description?: string;
  status?: string;
  priority?: string;
  assigneeId?: string;
  dueDate?: string;
  labels?: string[];
}

export interface UpdateTaskDto {
  title?: string;
  description?: string;
  status?: string;
  priority?: string;
  assigneeId?: string | null;
  dueDate?: string | null;
  labels?: string[];
  position?: number;
}

export interface TaskFilters {
  projectId: string;
  status?: string;
  assigneeId?: string;
}

@Injectable()
export class TasksService {
  constructor(
    @InjectDataSource() private readonly ds: DataSource,
    private readonly redis: RedisService,
    private readonly projectsService: ProjectsService,
  ) {}

  async findAll(
    schemaName: string,
    tenantId: string,
    filters: TaskFilters,
  ): Promise<Result<TaskRow[], DatabaseError>> {
    const filterKey = `${filters.status ?? 'all'}:${filters.assigneeId ?? 'all'}`;
    const cacheKey = CacheKey.taskList(tenantId, filters.projectId, filterKey);
    const cached = await this.redis.get<TaskRow[]>(cacheKey);
    if (cached.isOk() && cached.value !== null) return ok(cached.value);

    const result = await withTenantSchemaResult(this.ds, schemaName, async (qr) => {
      const conditions: string[] = ['t.project_id = $1'];
      const params: unknown[] = [filters.projectId];
      let idx = 2;

      if (filters.status) {
        conditions.push(`t.status = $${idx++}`);
        params.push(filters.status);
      }
      if (filters.assigneeId) {
        conditions.push(`t.assignee_id = $${idx++}`);
        params.push(filters.assigneeId);
      }

      const rows: TaskRow[] = await qr.query(
        `SELECT t.* FROM tasks t
         WHERE ${conditions.join(' AND ')}
         ORDER BY t.position ASC, t.created_at DESC`,
        params,
      );
      return rows;
    });

    if (result.isOk()) {
      await this.redis.set(cacheKey, result.value, CacheTTL.TASK_LIST);
    }
    return result;
  }

  async findOne(
    schemaName: string,
    taskId: string,
  ): Promise<Result<TaskRow, NotFoundError | DatabaseError>> {
    const result = await withTenantSchemaResult(this.ds, schemaName, async (qr) => {
      const rows: TaskRow[] = await qr.query(`SELECT * FROM tasks WHERE id = $1`, [taskId]);
      return rows[0] ?? null;
    });

    if (result.isErr()) return err(result.error);
    if (!result.value) return err(new NotFoundError(`Task ${taskId} not found`));
    return ok(result.value);
  }

  async create(
    schemaName: string,
    tenantId: string,
    dto: CreateTaskDto,
    reporterId: string,
  ): Promise<Result<TaskRow, DatabaseError>> {
    const result = await withTenantSchemaResult(this.ds, schemaName, async (qr) => {
      // Get max position for the project-status combo
      const posRows = await qr.query(
        `SELECT COALESCE(MAX(position), 0) + 1 AS next_pos FROM tasks WHERE project_id = $1 AND status = $2`,
        [dto.projectId, dto.status ?? 'backlog'],
      );
      const nextPos = posRows[0]?.next_pos ?? 0;

      const rows: TaskRow[] = await qr.query(
        `INSERT INTO tasks (project_id, title, description, status, priority, assignee_id, reporter_id, due_date, labels, position)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING *`,
        [
          dto.projectId,
          dto.title,
          dto.description ?? null,
          dto.status ?? 'backlog',
          dto.priority ?? 'medium',
          dto.assigneeId ?? null,
          reporterId,
          dto.dueDate ?? null,
          dto.labels ?? [],
          nextPos,
        ],
      );
      return rows[0];
    });

    if (result.isOk()) {
      await this.invalidateTaskCache(tenantId, dto.projectId);
    }
    return result;
  }

  async update(
    schemaName: string,
    tenantId: string,
    taskId: string,
    dto: UpdateTaskDto,
  ): Promise<Result<{ task: TaskRow; oldStatus?: string }, NotFoundError | DatabaseError>> {
    // Get old task to detect status change
    const oldResult = await this.findOne(schemaName, taskId);
    if (oldResult.isErr()) return err(oldResult.error);
    const oldTask = oldResult.value;
    const oldStatus = oldTask.status;

    const sets: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    if (dto.title !== undefined) { sets.push(`title = $${idx++}`); params.push(dto.title); }
    if (dto.description !== undefined) { sets.push(`description = $${idx++}`); params.push(dto.description); }
    if (dto.status !== undefined) { sets.push(`status = $${idx++}`); params.push(dto.status); }
    if (dto.priority !== undefined) { sets.push(`priority = $${idx++}`); params.push(dto.priority); }
    if (dto.assigneeId !== undefined) { sets.push(`assignee_id = $${idx++}`); params.push(dto.assigneeId); }
    if (dto.dueDate !== undefined) { sets.push(`due_date = $${idx++}`); params.push(dto.dueDate); }
    if (dto.labels !== undefined) { sets.push(`labels = $${idx++}`); params.push(dto.labels); }
    if (dto.position !== undefined) { sets.push(`position = $${idx++}`); params.push(dto.position); }

    if (sets.length === 0) return err(new DatabaseError('Nothing to update'));

    sets.push(`updated_at = NOW()`);
    params.push(taskId);

    const result = await withTenantSchemaResult(this.ds, schemaName, async (qr) => {
      const rows: TaskRow[] = await qr.query(
        `UPDATE tasks SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`,
        params,
      );
      return rows[0] ?? null;
    });

    if (result.isErr()) return err(result.error);
    if (!result.value) return err(new NotFoundError(`Task ${taskId} not found`));

    await this.invalidateTaskCache(tenantId, oldTask.project_id);
    // Invalidate project cache too since progress % may have changed
    if (dto.status !== undefined && dto.status !== oldStatus) {
      await this.projectsService.invalidateProjectCache(tenantId, oldTask.project_id);
    }

    return ok({ task: result.value, oldStatus: dto.status !== oldStatus ? oldStatus : undefined });
  }

  async remove(
    schemaName: string,
    tenantId: string,
    taskId: string,
  ): Promise<Result<void, NotFoundError | DatabaseError>> {
    const taskResult = await this.findOne(schemaName, taskId);
    if (taskResult.isErr()) return err(taskResult.error);

    const result = await withTenantSchemaResult(this.ds, schemaName, async (qr) => {
      await qr.query(`DELETE FROM tasks WHERE id = $1`, [taskId]);
    });

    if (result.isOk()) {
      await this.invalidateTaskCache(tenantId, taskResult.value.project_id);
      await this.projectsService.invalidateProjectCache(tenantId, taskResult.value.project_id);
    }
    return result;
  }

  private async invalidateTaskCache(tenantId: string, projectId: string): Promise<void> {
    await this.redis.delByPrefix(`tasks:${tenantId}:${projectId}:`);
  }
}
