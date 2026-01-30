import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { config } from '../../config/config';

// Create axios instance with base configuration
const apiClient: AxiosInstance = axios.create({
  baseURL: config.api.baseURL,
  timeout: config.api.timeout,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  withCredentials: true,
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Add authentication token if available
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Log request in development
    if (import.meta.env.DEV) {
      console.log(`➡️ ${config.method?.toUpperCase()} ${config.url}`, {
        data: config.data,
        params: config.params,
      });
    }

    return config;
  },
  (error) => {
    console.error('Request Error:', error);
    return Promise.reject(error);
  },
);

// Response interceptor
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Log response in development
    if (import.meta.env.DEV) {
      console.log(`⬅️ ${response.status} ${response.config.url}`, {
        data: response.data,
      });
    }
    return response;
  },
  (error) => {
    // Handle errors globally
    if (error.response) {
      // Server responded with error
      console.error('API Error:', {
        status: error.response.status,
        data: error.response.data,
        url: error.config.url,
      });

      // Handle specific error codes
      if (error.response.status === 401) {
        // Unauthorized - redirect to login
        localStorage.removeItem('auth_token');
        window.location.href = '/login';
      }

      if (error.response.status === 403) {
        // Forbidden
        console.error('Access forbidden');
      }
    } else if (error.request) {
      // Request was made but no response
      console.error('Network Error:', error.message);
    } else {
      // Something else happened
      console.error('Error:', error.message);
    }

    return Promise.reject(error);
  },
);

// API Service Interface
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  timestamp: string;
}

// API Service Functions
export const apiService = {
  // Health Check
  async getHealth(): Promise<ApiResponse> {
    const response = await apiClient.get('/health');
    return response.data;
  },

  // Configuration
  async getConfig(): Promise<ApiResponse> {
    const response = await apiClient.get('/config');
    return response.data;
  },

  // Tenants
  async getTenants(): Promise<ApiResponse> {
    const response = await apiClient.get('/tenants');
    return response.data;
  },

  async getTenantById(id: string): Promise<ApiResponse> {
    const response = await apiClient.get(`/tenants/${id}`);
    return response.data;
  },

  async createTenant(data: any): Promise<ApiResponse> {
    const response = await apiClient.post('/tenants', data);
    return response.data;
  },

  // Users
  async getUsers(): Promise<ApiResponse> {
    const response = await apiClient.get('/users');
    return response.data;
  },

  async getUserById(id: string): Promise<ApiResponse> {
    const response = await apiClient.get(`/users/${id}`);
    return response.data;
  },

  // Utility function for custom requests
  request<T = any>(config: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return apiClient.request<T>(config);
  },
};

export default apiClient;
