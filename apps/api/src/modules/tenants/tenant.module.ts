import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TenantEntity } from './entities/tenant.entity';
import { MembershipEntity } from '../memberships/entities/membership.entity';
import { TenantService } from './tenant.service';
import { TenantController } from './tenant.controller';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([TenantEntity, MembershipEntity]),
    AuditModule,
  ],
  controllers: [TenantController],
  providers: [TenantService],
  exports: [TenantService],
})
export class TenantModule {}
