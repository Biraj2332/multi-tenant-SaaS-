import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { UserEntity } from '../users/entities/user.entity';
import { TenantEntity } from '../tenants/entities/tenant.entity';
import { MembershipEntity } from '../memberships/entities/membership.entity';
import { InvitationEntity } from '../invitations/entities/invitation.entity';
import { AuditLogEntity } from '../audit/entities/audit-log.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres' as const,
        url: config.get<string>('database.url'),
        entities: [UserEntity, TenantEntity, MembershipEntity, InvitationEntity, AuditLogEntity],
        synchronize: config.get<string>('nodeEnv') === 'development',
        logging: config.get<string>('nodeEnv') === 'development',
        extra: {
          max: config.get<number>('database.maxConnections', 10),
        },
      }),
    }),
  ],
})
export class DatabaseModule {}
