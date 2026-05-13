import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Result, ok, err } from 'neverthrow';
import { IssueError, NotFoundError, DatabaseError } from '../../common/errors/app.errors';
import { withTenantSchemaResult } from '../../common/helpers/tenant-query';
import { RedisService } from '../redis/redis.service';
import { CacheKey } from '../redis/redis.types';

export type IssueType = 'TASK' | 'BUG' | 'FEATURE';
export type IssueSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type IssueStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

export interface IssueRow {
  id: string;
  project_id: string;
  sprint_id: string | null;
  title: string;
  description: string | null;
  type: IssueType;
  severity: IssueSeverity | null;
  status: IssueStatus;
  priority: string;
  assignee_id: string | null;
  rank: number;
  reported_by_user_id: string;
  steps_to_reproduce: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateIssueDto {
  projectId: string;
  title: string;
  description?: string;
  type?: IssueType;
  severity?: IssueSeverity;
  priority?: string;
  assigneeId?: string;
  sprintId?: string;
  stepsToReproduce?: string;
}

export interface IssueFilters {
  projectId?: string;
  type?: IssueType;
  status?: IssueStatus;
  sprintId?: string | 'BACKLOG';
}

@Injectable()
export class IssuesService {
  constructor(
    @InjectDataSource() private readonly ds: DataSource,
    private readonly redis: RedisService,
  ) {}

  async findAll(
    schemaName: string,
    tenantId: string,
    filters: IssueFilters,
  ): Promise<Result<IssueRow[], DatabaseError>> {
    const conditions: string[] = ['1=1'];
    const params: unknown[] = [];
    let i = 1;
    if (filters.projectId) { conditions.push(`project_id = $${i++}`); params.push(filters.projectId); }
    if (filters.type) { conditions.push(`type = $${i++}`); params.push(filters.type); }
    if (filters.status) { conditions.push(`status = $${i++}`); params.push(filters.status); }
    if (filters.sprintId === 'BACKLOG') { conditions.push(`sprint_id IS NULL`); }
    else if (filters.sprintId) { conditions.push(`sprint_id = $${i++}`); params.push(filters.sprintId); }

    return withTenantSchemaResult(this.ds, schemaName, async (qr) => {
      const rows: IssueRow[] = await qr.query(
        `SELECT * FROM issues WHERE ${conditions.join(' AND ')} ORDER BY rank ASC, created_at DESC`,
        params,
      );
      return rows;
    });
  }

  async create(
    schemaName: string,
    tenantId: string,
    dto: CreateIssueDto,
    reportedBy: string,
  ): Promise<Result<IssueRow, DatabaseError>> {
    const result = await withTenantSchemaResult(this.ds, schemaName, async (qr) => {
      const rankRows = await qr.query(
        `SELECT COALESCE(MAX(rank), 0) + 1024 AS r FROM issues WHERE project_id = $1`,
        [dto.projectId],
      );
      const nextRank = Number(rankRows[0]?.r ?? 1024);

      const rows: IssueRow[] = await qr.query(
        `INSERT INTO issues (project_id, title, description, type, severity, priority, assignee_id, sprint_id, steps_to_reproduce, reported_by_user_id, rank)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
        [
          dto.projectId, dto.title, dto.description ?? null,
          dto.type ?? 'TASK', dto.severity ?? null, dto.priority ?? 'MEDIUM',
          dto.assigneeId ?? null, dto.sprintId ?? null,
          dto.stepsToReproduce ?? null, reportedBy, nextRank,
        ],
      );
      return rows[0];
    });
    if (result.isOk()) await this.redis.delByPrefix(`issues:${tenantId}:`);
    return result;
  }

  async update(
    schemaName: string,
    tenantId: string,
    id: string,
    patch: Partial<IssueRow>,
  ): Promise<Result<IssueRow, NotFoundError | DatabaseError>> {
    const allowed: Array<keyof IssueRow> = [
      'title', 'description', 'status', 'priority', 'severity',
      'assignee_id', 'sprint_id', 'rank',
    ];
    const sets: string[] = [];
    const params: unknown[] = [];
    let i = 1;
    for (const key of allowed) {
      if (patch[key] !== undefined) {
        sets.push(`${key} = $${i++}`);
        params.push(patch[key]);
      }
    }
    if (sets.length === 0) return err(new DatabaseError('Nothing to update'));
    sets.push(`updated_at = NOW()`);
    params.push(id);

    const result = await withTenantSchemaResult(this.ds, schemaName, async (qr) => {
      const rows: IssueRow[] = await qr.query(
        `UPDATE issues SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`,
        params,
      );
      return rows[0] ?? null;
    });
    if (result.isErr()) return err(result.error);
    if (!result.value) return err(new NotFoundError(`Issue ${id} not found`));
    await this.redis.delByPrefix(`issues:${tenantId}:`);
    return ok(result.value);
  }

  async bulkMoveToSprint(
    schemaName: string,
    tenantId: string,
    issueIds: string[],
    sprintId: string | null,
  ): Promise<Result<number, IssueError | DatabaseError>> {
    if (issueIds.length === 0) return ok(0);
    const result = await withTenantSchemaResult(this.ds, schemaName, async (qr) => {
      const r = await qr.query(
        `UPDATE issues SET sprint_id = $1, updated_at = NOW()
         WHERE id = ANY($2::uuid[])`,
        [sprintId, issueIds],
      );
      return Array.isArray(r) ? (r[1] as number) ?? issueIds.length : issueIds.length;
    });
    if (result.isErr()) return err(result.error);
    await this.redis.delByPrefix(`issues:${tenantId}:`);
    return ok(result.value);
  }

  async remove(
    schemaName: string,
    tenantId: string,
    id: string,
  ): Promise<Result<void, DatabaseError>> {
    const result = await withTenantSchemaResult(this.ds, schemaName, async (qr) => {
      await qr.query(`DELETE FROM issues WHERE id = $1`, [id]);
    });
    if (result.isOk()) await this.redis.delByPrefix(`issues:${tenantId}:`);
    return result;
  }
}
