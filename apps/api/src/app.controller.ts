import { Controller, Get, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HealthResponse } from './dto/base.dto';
import { TenantResponseDto, TenantPlan, TenantStatus } from './dto/tenant.dto';
import { UserDto, UserRole } from './dto/user.dto';

@ApiTags('health')
@Controller()
export class AppController {
  constructor(private configService: ConfigService) {}

  @Get()
  @ApiOperation({
    summary: 'API Welcome',
    description: 'Returns a welcome message for the TenantOps API',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Welcome message returned successfully',
  })
  getHello(): { message: string; version: string; environment: string } {
    return {
      message: 'TenantOps API',
      version: '1.0.0',
      environment: this.configService.get('nodeEnv'),
    };
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
  getHealth(): HealthResponse {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'tenantops-api',
      version: '1.0.0',
      environment: this.configService.get('nodeEnv'),
      uptime: process.uptime(),
    };
  }

  @Get('config')
  @ApiOperation({
    summary: 'Get API Configuration',
    description: 'Get current API configuration (non-sensitive data only)',
  })
  getConfig() {
    return {
      environment: this.configService.get('nodeEnv'),
      port: this.configService.get('port'),
      apiPrefix: this.configService.get('apiPrefix'),
      appUrl: this.configService.get('appUrl'),
      apiUrl: this.configService.get('apiUrl'),
      corsOrigin: this.configService.get('cors.origin'),
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
    type: [TenantResponseDto],
  })
  getTenants(): TenantResponseDto[] {
    return [
      {
        id: '1',
        name: 'Acme Corporation',
        slug: 'acme',
        plan: TenantPlan.ENTERPRISE,
        status: TenantStatus.ACTIVE,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: '2',
        name: 'Beta Industries',
        slug: 'beta',
        plan: TenantPlan.PRO,
        status: TenantStatus.ACTIVE,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: '3',
        name: 'Gamma Tech',
        slug: 'gamma',
        plan: TenantPlan.FREE,
        status: TenantStatus.ACTIVE,
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
  getUsers(): UserDto[] {
    return [
      {
        id: '1',
        name: 'John Doe',
        email: 'john@acme.com',
        tenantId: '1',
        role: UserRole.OWNER,
        createdAt: new Date().toISOString(),
      },
      {
        id: '2',
        name: 'Jane Smith',
        email: 'jane@beta.com',
        tenantId: '2',
        role: UserRole.ADMIN,
        createdAt: new Date().toISOString(),
      },
      {
        id: '3',
        name: 'Bob Wilson',
        email: 'bob@gamma.com',
        tenantId: '3',
        role: UserRole.MEMBER,
        createdAt: new Date().toISOString(),
      },
    ];
  }
}
