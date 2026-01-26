import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getHello(): string {
    return 'TenantOps API v1.0';
  }

  @Get('health')
  getHealth(): { status: string; timestamp: string } {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('tenants')
  getTenants(): Array<{
    id: string;
    name: string;
    slug: string;
    plan: string;
    status: string;
  }> {
    return [
      {
        id: '1',
        name: 'Acme Corporation',
        slug: 'acme',
        plan: 'enterprise',
        status: 'active',
      },
      {
        id: '2',
        name: 'Beta Industries',
        slug: 'beta',
        plan: 'pro',
        status: 'active',
      },
      {
        id: '3',
        name: 'Gamma Tech',
        slug: 'gamma',
        plan: 'free',
        status: 'active',
      },
    ];
  }

  @Get('users')
  getUsers(): Array<{
    id: string;
    name: string;
    email: string;
    tenantId: string;
    role: string;
  }> {
    return [
      {
        id: '1',
        name: 'John Doe',
        email: 'john@acme.com',
        tenantId: '1',
        role: 'admin',
      },
      {
        id: '2',
        name: 'Jane Smith',
        email: 'jane@beta.com',
        tenantId: '2',
        role: 'owner',
      },
    ];
  }
}
