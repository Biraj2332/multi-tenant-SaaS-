import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TenantEntity } from '../tenants/entities/tenant.entity';
import { SettingsService } from './settings.service';
import { SettingsController } from './settings.controller';
import { TenantModule } from '../tenants/tenant.module';
import { ActivityModule } from '../activity/activity.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [TypeOrmModule.forFeature([TenantEntity]), TenantModule, ActivityModule, AuditModule],
  controllers: [SettingsController],
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}
