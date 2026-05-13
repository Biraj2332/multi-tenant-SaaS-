import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Result, ok, err } from 'neverthrow';
import { SprintError, NotFoundError, DatabaseError } from '../../common/errors/app.errors';
import { withTenantSchemaResult } from '../../common/helpers/tenant-query';
import { RedisService } from '../redis/redis.service';
import { CacheKey, CacheTTL } from '../redis/redis.types';

export type SprintStatus = 'PLANNED' | 'ACTIVE' | 'COMPLETED';

export interface SprintRow {
  id: string;
  project_id: string;
  name: string;
  goal: string | null;
  status: SprintStatus;
  starts_at: string | null;
  ends_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface CreateSprintDto {
  projectId: string;
  name: string;
  goal?: string;
  startsAt?: string;
  endsAt?: string;
}

@Injectable()
export class SprintsService {
  constructor(
    @InjectDataSource() private readonly ds: DataSource,
    private readonly redis: RedisService,
  ) {}

  async findByProject(
    schemaName: string,
    tenantId: string,
    projectId: string,
  ): Promise<Result<SprintRow[], DatabaseError>> {
    const cacheKey = CacheKey.sprints(tenantId, projectId);
    const cached = await this.redis.get<SprintRow[]>(cacheKey);
    if (cached.isOk() && cached.value !== null) return ok(cached.value);

    const result = await withTenantSchemaResult(this.ds, schemaName, async (qr) => {
      const rows: SprintRow[] = await qr.query(
        `SELECT * FROM sprints WHERE project_id = $1 ORDER BY created_at DESC`,
        [projectId],
      );
      return rows;
    });

    if (result.isOk()) {
      await this.redis.set(cacheKey, result.value, CacheTTL.SPRINTS);
    }
    return result;
  }

  async getActive(
    schemaName: string,
    tenantId: string,
    projectId: string,
  ): Promise<Result<SprintRow | null, DatabaseError>> {
    const cacheKey = CacheKey.sprintActive(tenantId, projectId);
    const cached = await this.redis.get<SprintRow | null>(cacheKey);
    if (cached.isOk() && cached.value !== null) return ok(cached.value);

    const result = await withTenantSchemaResult(this.ds, schemaName, async (qr) => {
      const rows: SprintRow[] = await qr.query(
        `SELECT * FROM sprints WHERE project_id = $1 AND status = 'ACTIVE' LIMIT 1`,
        [projectId],
      );
      return rows[0] ?? null;
    });

    if (result.isOk() && result.value) {
      await this.redis.set(cacheKey, result.value, CacheTTL.SPRINT_ACTIVE);
    }
    return result;
  }

  async create(
    schemaName: string,
    tenantId: string,
    dto: CreateSprintDto,
  ): Promise<Result<SprintRow, DatabaseError>> {
    const result = await withTenantSchemaResult(this.ds, schemaName, async (qr) => {
      const rows: SprintRow[] = await qr.query(
        `INSERT INTO sprints (project_id, name, goal, status, starts_at, ends_at)
         VALUES ($1, $2, $3, 'PLANNED', $4, $5) RETURNING *`,
        [dto.projectId, dto.name, dto.goal ?? null, dto.startsAt ?? null, dto.endsAt ?? null],
      );
      return rows[0];
    });

    if (result.isOk()) {
      await this.redis.del(CacheKey.sprints(tenantId, dto.projectId));
    }
    return result;
  }

  async start(
    schemaName: string,
    tenantId: string,
    sprintId: string,
  ): Promise<Result<SprintRow, SprintError | NotFoundError | DatabaseError>> {
    const findResult = await withTenantSchemaResult(this.ds, schemaName, async (qr) => {
      const rows: SprintRow[] = await qr.query(`SELECT * FROM sprints WHERE id = $1`, [sprintId]);
      return rows[0] ?? null;
    });
    if (findResult.isErr()) return err(findResult.error);
    if (!findResult.value) return err(new NotFoundError(`Sprint ${sprintId} not found`));
    if (findResult.value.status !== 'PLANNED') {
      return err(new SprintError(`Cannot start sprint in status ${findResult.value.status}`));
    }

    const updateResult = await withTenantSchemaResult(this.ds, schemaName, async (qr) => {
      const rows: SprintRow[] = await qr.query(
        `UPDATE sprints SET status = 'ACTIVE', started_at = NOW() WHERE id = $1 RETURNING *`,
        [sprintId],
      );
      return rows[0];
    });

    if (updateResult.isErr()) {
      // Likely partial unique index violation (another active sprint)
      return err(new SprintError('Another sprint is already active for this project', updateResult.error));
    }

    await this.redis.del(CacheKey.sprints(tenantId, updateResult.value.project_id));
    await this.redis.del(CacheKey.sprintActive(tenantId, updateResult.value.project_id));
    return ok(updateResult.value);
  }

  async complete(
    schemaName: string,
    tenantId: string,
    sprintId: string,
  ): Promise<Result<SprintRow, SprintError | NotFoundError | DatabaseError>> {
    const result = await withTenantSchemaResult(this.ds, schemaName, async (qr) => {
      const rows: SprintRow[] = await qr.query(
        `UPDATE sprints SET status = 'COMPLETED', completed_at = NOW()
         WHERE id = $1 AND status = 'ACTIVE' RETURNING *`,
        [sprintId],
      );
      return rows[0] ?? null;
    });
    if (result.isErr()) return err(result.error);
    if (!result.value) return err(new SprintError('Sprint not found or not active'));

    await this.redis.del(CacheKey.sprints(tenantId, result.value.project_id));
    await this.redis.del(CacheKey.sprintActive(tenantId, result.value.project_id));
    return ok(result.value);
  }
}
