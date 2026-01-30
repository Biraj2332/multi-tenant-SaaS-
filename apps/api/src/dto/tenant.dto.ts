import { ApiProperty } from '@nestjs/swagger';

export enum TenantPlan {
  FREE = 'free',
  PRO = 'pro',
  ENTERPRISE = 'enterprise',
}

export enum TenantStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
}

export class CreateTenantDto {
  @ApiProperty({ description: 'Tenant name', example: 'Acme Corporation' })
  name: string;

  @ApiProperty({ description: 'Tenant slug (URL friendly)', example: 'acme' })
  slug: string;

  @ApiProperty({ description: 'Owner email', example: 'owner@acme.com' })
  ownerEmail: string;

  @ApiProperty({
    description: 'Subscription plan',
    enum: TenantPlan,
    default: TenantPlan.FREE,
  })
  plan?: TenantPlan;
}

export class TenantResponseDto {
  @ApiProperty({ description: 'Tenant ID' })
  id: string;

  @ApiProperty({ description: 'Tenant name' })
  name: string;

  @ApiProperty({ description: 'Tenant slug' })
  slug: string;

  @ApiProperty({ enum: TenantPlan, description: 'Subscription plan' })
  plan: TenantPlan;

  @ApiProperty({ enum: TenantStatus, description: 'Tenant status' })
  status: TenantStatus;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: string;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: string;
}

export class UpdateTenantDto {
  @ApiProperty({ description: 'Tenant name', required: false })
  name?: string;

  @ApiProperty({ description: 'Subscription plan', enum: TenantPlan, required: false })
  plan?: TenantPlan;

  @ApiProperty({ description: 'Tenant status', enum: TenantStatus, required: false })
  status?: TenantStatus;
}
