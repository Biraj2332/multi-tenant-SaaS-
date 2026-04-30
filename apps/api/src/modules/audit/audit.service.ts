import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ResultAsync, ok } from 'neverthrow';
import { Result } from 'neverthrow';
import { AuditLogEntity, AuditEntry } from './entities/audit-log.entity';
import { DatabaseError } from '../../common/errors/app.errors';

export interface IAuditService {
  log(entry: AuditEntry): Promise<Result<AuditLogEntity, DatabaseError>>;
  findByTenant(tenantId: string, limit?: number): Promise<Result<AuditLogEntity[], DatabaseError>>;
}

@Injectable()
export class AuditService implements IAuditService {
  constructor(
    @InjectRepository(AuditLogEntity)
    private readonly repo: Repository<AuditLogEntity>,
  ) {}

  async log(entry: AuditEntry): Promise<Result<AuditLogEntity, DatabaseError>> {
    return ResultAsync.fromPromise(
      this.repo.save(this.repo.create(entry)),
      (e) => new DatabaseError('Failed to write audit log', e),
    );
  }

  async findByTenant(tenantId: string, limit = 100): Promise<Result<AuditLogEntity[], DatabaseError>> {
    return ResultAsync.fromPromise(
      this.repo.find({
        where: { tenantId },
        order: { createdAt: 'DESC' },
        take: limit,
      }),
      (e) => new DatabaseError('Failed to read audit logs', e),
    );
  }
}
