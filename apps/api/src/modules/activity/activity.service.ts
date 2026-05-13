import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Result } from 'neverthrow';
import { DatabaseError } from '../../common/errors/app.errors';
import { withTenantSchemaResult } from '../../common/helpers/tenant-query';

export interface ActivityRow {
  id: string;
  actor_id: string | null;
  action: string;
  target_type: string;
  target_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface LogActivityDto {
  actorId: string | null;
  action: string;
  targetType: string;
  targetId: string | null;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class ActivityService {
  constructor(@InjectDataSource() private readonly ds: DataSource) {}

  async log(
    schemaName: string,
    dto: LogActivityDto,
  ): Promise<Result<ActivityRow, DatabaseError>> {
    return withTenantSchemaResult(this.ds, schemaName, async (qr) => {
      const rows: ActivityRow[] = await qr.query(
        `INSERT INTO activity_logs (actor_id, action, target_type, target_id, metadata)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [dto.actorId, dto.action, dto.targetType, dto.targetId, dto.metadata ?? {}],
      );
      return rows[0];
    });
  }

  async findByEntity(
    schemaName: string,
    targetId: string,
    limit = 50,
  ): Promise<Result<ActivityRow[], DatabaseError>> {
    return withTenantSchemaResult(this.ds, schemaName, async (qr) => {
      const rows: ActivityRow[] = await qr.query(
        `SELECT * FROM activity_logs WHERE target_id = $1 ORDER BY created_at DESC LIMIT $2`,
        [targetId, limit],
      );
      return rows;
    });
  }
}
