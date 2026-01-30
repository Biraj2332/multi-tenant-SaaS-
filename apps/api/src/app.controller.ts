import { Controller, Get, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

class HealthResponse {
  status: string;
  timestamp: string;
  service: string;
  version: string;
}

class TenantDto {
  id: string;
  name: string;
  slug: string;
  plan: 'free' | 'pro' | 'enterprise';
  status: 'active' | 'inactive' | 'suspended';
  createdAt: string;
  updatedAt: string;
}

class UserDto {
  id: string;
  name: string;
  email: string;
  tenantId: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  createdAt: string;
}

@ApiTags('health')
@Controller()
export class AppController {
  @Get()
  @ApiOperation({
    summary: 'API Welcome',
    description: 'Returns a welcome message for the TenantOps API',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Welcome message returned successfully',
  })
  getHello(): string {
    return 'TenantOps API v1.0';
  }

  @Get('health')
  @ApiOperation({
    summary: 'Health Check',
    description: 'Check the health status of the API service',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Service is healthy',
    type: HealthResponse,
  })
  @ApiResponse({
    status: HttpStatus.SERVICE_UNAVAILABLE,
    description: 'Service is unhealthy',
  })
  getHealth(): HealthResponse {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'tenantops-api',
      version: '1.0.0',
    };
  }

  @Get('tenants')
  @ApiTags('tenants')
  @ApiOperation({
    summary: 'Get all tenants',
    description: 'Retrieve a list of all tenants (sample data for now)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of tenants returned successfully',
    type: [TenantDto],
  })
  @ApiBearerAuth('JWT-auth')
  getTenants(): TenantDto[] {
    return [
      {
        id: '1',
        name: 'Acme Corporation',
        slug: 'acme',
        plan: 'enterprise',
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: '2',
        name: 'Beta Industries',
        slug: 'beta',
        plan: 'pro',
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: '3',
        name: 'Gamma Tech',
        slug: 'gamma',
        plan: 'free',
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
  }

  @Get('users')
  @ApiTags('users')
  @ApiOperation({
    summary: 'Get all users',
    description: 'Retrieve a list of all users across tenants (sample data for now)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of users returned successfully',
    type: [UserDto],
  })
  @ApiBearerAuth('JWT-auth')
  getUsers(): UserDto[] {
    return [
      {
        id: '1',
        name: 'John Doe',
        email: 'john@acme.com',
        tenantId: '1',
        role: 'owner',
        createdAt: new Date().toISOString(),
      },
      {
        id: '2',
        name: 'Jane Smith',
        email: 'jane@beta.com',
        tenantId: '2',
        role: 'admin',
        createdAt: new Date().toISOString(),
      },
      {
        id: '3',
        name: 'Bob Wilson',
        email: 'bob@gamma.com',
        tenantId: '3',
        role: 'member',
        createdAt: new Date().toISOString(),
      },
    ];
  }
}
