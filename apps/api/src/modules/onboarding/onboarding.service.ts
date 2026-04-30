import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Result, ok, err, ResultAsync } from 'neverthrow';
import { TenantEntity, toTenantDto, TenantDto } from '../tenants/entities/tenant.entity';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../audit/enums/audit-action.enum';
import { AuditTargetType } from '../audit/enums/audit-target.enum';
import {
  OnboardingError,
  DatabaseError,
  NotFoundError,
} from '../../common/errors/app.errors';
import { v4 as uuidv4 } from 'uuid';

export interface OnboardingDto {
  tenantId: string;
  actorId: string;
  projectName: string;
  projectColor: string;
}

export interface OnboardingResult {
  tenant: TenantDto;
  projectId: string;
}

@Injectable()
export class OnboardingService {
  constructor(
    @InjectRepository(TenantEntity)
    private readonly tenantRepo: Repository<TenantEntity>,
    private readonly auditService: AuditService,
  ) {}

  async completeOnboarding(
    dto: OnboardingDto,
  ): Promise<Result<OnboardingResult, OnboardingError | DatabaseError | NotFoundError>> {
    const findResult = await ResultAsync.fromPromise(
      this.tenantRepo.findOne({ where: { id: dto.tenantId } }),
      (e) => new DatabaseError('Failed to find tenant', e),
    );

    if (findResult.isErr()) return err(findResult.error);
    const tenant = findResult.value;
    if (!tenant) return err(new NotFoundError(`Tenant ${dto.tenantId} not found`));
    if (tenant.onboardedAt) return err(new OnboardingError('Tenant already onboarded'));

    tenant.onboardedAt = new Date();
    const saveResult = await ResultAsync.fromPromise(
      this.tenantRepo.save(tenant),
      (e) => new DatabaseError('Failed to update tenant onboardedAt', e),
    );
    if (saveResult.isErr()) return err(saveResult.error);

    const projectId = uuidv4();

    await this.auditService.log({
      tenantId: dto.tenantId,
      actorId: dto.actorId,
      action: AuditAction.ONBOARDING_COMPLETED,
      targetType: AuditTargetType.TENANT,
      targetId: dto.tenantId,
      metadata: { projectName: dto.projectName, projectColor: dto.projectColor },
      ipAddress: null,
      userAgent: null,
    });

    await this.auditService.log({
      tenantId: dto.tenantId,
      actorId: dto.actorId,
      action: AuditAction.PROJECT_CREATED,
      targetType: AuditTargetType.PROJECT,
      targetId: projectId,
      metadata: { name: dto.projectName, color: dto.projectColor },
      ipAddress: null,
      userAgent: null,
    });

    return ok({
      tenant: toTenantDto(saveResult.value),
      projectId,
    });
  }
}
