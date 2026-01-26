import { Tenant, CreateTenantDto } from '../../core/domain/tenant/types';

export class TenantService {
  async createTenant(dto: CreateTenantDto): Promise<Tenant> {
    // This would call infrastructure layer
    const tenant: Tenant = {
      id: Math.random().toString(36).substr(2, 9),
      ...dto,
      plan: 'free',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    return tenant;
  }
}
