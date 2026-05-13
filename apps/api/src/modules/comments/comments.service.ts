import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Result, ok, err } from 'neverthrow';
import { DatabaseError } from '../../common/errors/app.errors';
import { withTenantSchemaResult } from '../../common/helpers/tenant-query';

export interface CommentRow {
  id: string;
  task_id: string;
  author_id: string;
  body: string;
  created_at: string;
  updated_at: string;
}

@Injectable()
export class CommentsService {
  constructor(@InjectDataSource() private readonly ds: DataSource) {}

  async findByTask(
    schemaName: string,
    taskId: string,
  ): Promise<Result<CommentRow[], DatabaseError>> {
    return withTenantSchemaResult(this.ds, schemaName, async (qr) => {
      const rows: CommentRow[] = await qr.query(
        `SELECT * FROM comments WHERE task_id = $1 ORDER BY created_at ASC`,
        [taskId],
      );
      return rows;
    });
  }

  async create(
    schemaName: string,
    taskId: string,
    authorId: string,
    body: string,
  ): Promise<Result<CommentRow, DatabaseError>> {
    return withTenantSchemaResult(this.ds, schemaName, async (qr) => {
      const rows: CommentRow[] = await qr.query(
        `INSERT INTO comments (task_id, author_id, body) VALUES ($1, $2, $3) RETURNING *`,
        [taskId, authorId, body],
      );
      return rows[0];
    });
  }
}
