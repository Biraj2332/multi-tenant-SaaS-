// Shared API contracts between frontend and backend

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Tenant contracts
export interface Tenant {
  id: string;
  name: string;
  slug: string;
  plan: 'free' | 'pro' | 'enterprise';
  status: 'active' | 'inactive' | 'suspended';
  createdAt: string;
  updatedAt: string;
}

export interface CreateTenantDto {
  name: string;
  slug: string;
  ownerEmail: string;
  plan?: Tenant['plan'];
}

export interface UpdateTenantDto {
  name?: string;
  plan?: Tenant['plan'];
  status?: Tenant['status'];
}

// User contracts
export type UserRole = 'owner' | 'admin' | 'member' | 'viewer';

export interface User {
  id: string;
  name: string;
  email: string;
  tenantId: string;
  role: UserRole;
  createdAt: string;
}

export interface CreateUserDto {
  name: string;
  email: string;
  tenantId: string;
  role?: UserRole;
}
