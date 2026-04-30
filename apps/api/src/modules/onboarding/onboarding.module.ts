import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TenantEntity } from '../tenants/entities/tenant.entity';
import { OnboardingService } from './onboarding.service';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [TypeOrmModule.forFeature([TenantEntity]), AuditModule],
  providers: [OnboardingService],
  exports: [OnboardingService],
})
export class OnboardingModule {}
