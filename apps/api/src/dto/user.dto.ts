import { ApiProperty } from '@nestjs/swagger';

export enum UserRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  MEMBER = 'member',
  VIEWER = 'viewer',
}

export class UserDto {
  @ApiProperty({ description: 'User ID' })
  id: string;

  @ApiProperty({ description: 'User full name' })
  name: string;

  @ApiProperty({ description: 'User email' })
  email: string;

  @ApiProperty({ description: 'Tenant ID the user belongs to' })
  tenantId: string;

  @ApiProperty({ enum: UserRole, description: 'User role' })
  role: UserRole;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: string;
}

export class CreateUserDto {
  @ApiProperty({ description: 'User full name', example: 'John Doe' })
  name: string;

  @ApiProperty({ description: 'User email', example: 'john@example.com' })
  email: string;

  @ApiProperty({ description: 'Tenant ID', example: 'tenant-123' })
  tenantId: string;

  @ApiProperty({
    description: 'User role',
    enum: UserRole,
    default: UserRole.MEMBER,
  })
  role?: UserRole;
}
