import { ApiProperty } from '@nestjs/swagger';

export class BaseResponseDto {
  @ApiProperty({ description: 'Success status' })
  success: boolean;

  @ApiProperty({ description: 'Response message' })
  message: string;

  @ApiProperty({ description: 'Response data' })
  data?: any;

  @ApiProperty({ description: 'Error details if any' })
  error?: string;

  @ApiProperty({ description: 'Request timestamp' })
  timestamp: string;
}

export class PaginationDto {
  @ApiProperty({ description: 'Page number', default: 1, minimum: 1 })
  page: number;

  @ApiProperty({ description: 'Items per page', default: 10, minimum: 1, maximum: 100 })
  limit: number;
}

export class PaginatedResponseDto<T> {
  @ApiProperty({ description: 'Array of items' })
  data: T[];

  @ApiProperty({ description: 'Total number of items' })
  total: number;

  @ApiProperty({ description: 'Current page number' })
  page: number;

  @ApiProperty({ description: 'Items per page' })
  limit: number;

  @ApiProperty({ description: 'Total number of pages' })
  totalPages: number;
}

export class HealthResponse {
  @ApiProperty({ description: 'Service status', example: 'healthy' })
  status: string;

  @ApiProperty({ description: 'Timestamp of the check' })
  timestamp: string;

  @ApiProperty({ description: 'Service name', example: 'tenantops-api' })
  service: string;

  @ApiProperty({ description: 'Service version', example: '1.0.0' })
  version: string;

  @ApiProperty({ description: 'Environment', example: 'development' })
  environment?: string;

  @ApiProperty({ description: 'Uptime in seconds' })
  uptime?: number;
}
