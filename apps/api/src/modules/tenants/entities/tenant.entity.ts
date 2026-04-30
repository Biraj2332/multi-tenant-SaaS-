import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { Plan } from '../enums/plan.enum';

@Entity('tenants')
export class TenantEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index({ unique: true })
  @Column({ name: 'clerk_org_id', type: 'varchar', length: 255 })
  clerkOrgId!: string;

  @Index({ unique: true })
  @Column({ name: 'schema_name', type: 'varchar', length: 63 })
  schemaName!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 255 })
  slug!: string;

  @Column({ type: 'enum', enum: Plan, default: Plan.STARTER })
  plan!: Plan;

  @Column({ name: 'onboarded_at', type: 'timestamptz', nullable: true })
  onboardedAt!: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}

export interface TenantDto {
  id: string;
  clerkOrgId: string;
  schemaName: string;
  name: string;
  slug: string;
  plan: Plan;
  onboardedAt: Date | null;
  createdAt: Date;
}

export function toTenantDto(entity: TenantEntity): TenantDto {
  return {
    id: entity.id,
    clerkOrgId: entity.clerkOrgId,
    schemaName: entity.schemaName,
    name: entity.name,
    slug: entity.slug,
    plan: entity.plan,
    onboardedAt: entity.onboardedAt,
    createdAt: entity.createdAt,
  };
}
