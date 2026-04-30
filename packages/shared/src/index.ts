// Shared utilities and helpers

// Date utilities
export const formatDate = (date: Date | string): string => {
  return new Date(date).toISOString();
};

export const isValidDate = (date: unknown): boolean => {
  return date instanceof Date && !isNaN(date.getTime());
};

// String utilities
export const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

export const capitalize = (text: string): string => {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

// Pagination utilities
export interface PaginationParams {
  page?: number;
  limit?: number;
}

export const normalizePagination = (
  params: PaginationParams,
): Required<PaginationParams> => {
  return {
    page: Math.max(1, params.page ?? 1),
    limit: Math.min(100, Math.max(1, params.limit ?? 10)),
  };
};

export const calculateTotalPages = (total: number, limit: number): number => {
  return Math.ceil(total / limit);
};

// ID generation (simple, for development use)
export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 11);
};

// Environment helpers
export const isDevelopment = (): boolean => process.env.NODE_ENV === 'development';
export const isProduction = (): boolean => process.env.NODE_ENV === 'production';
export const isTest = (): boolean => process.env.NODE_ENV === 'test';
