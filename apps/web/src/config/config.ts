// Application Configuration
export const config = {
  // API Configuration
  api: {
    url: import.meta.env.VITE_API_URL || 'http://localhost:13000',
    prefix: import.meta.env.VITE_API_PREFIX || 'api/v1',
    timeout: parseInt(import.meta.env.VITE_API_TIMEOUT || '10000', 10),
    baseURL: `${import.meta.env.VITE_API_URL || 'http://localhost:13000'}/${
      import.meta.env.VITE_API_PREFIX || 'api/v1'
    }`,
  },

  // Clerk Authentication
  clerk: {
    publishableKey: import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || '',
  },

  // Application Info
  app: {
    name: import.meta.env.VITE_APP_NAME || 'TenantOps',
    version: import.meta.env.VITE_APP_VERSION || '1.0.0',
    env: import.meta.env.VITE_APP_ENV || 'development',
  },

  // Feature Flags
  features: {
    analytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
    debug: import.meta.env.VITE_ENABLE_DEBUG === 'true',
  },

  // UI Configuration
  ui: {
    primaryColor: import.meta.env.VITE_PRIMARY_COLOR || '#4f46e5',
    secondaryColor: import.meta.env.VITE_SECONDARY_COLOR || '#7c3aed',
  },

  // Environment Detection
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
  isTest: import.meta.env.MODE === 'test',
};

// Type-safe environment variable access
export const getEnv = (key: string): string => {
  const value = import.meta.env[key];
  if (value === undefined) {
    console.warn(`Environment variable ${key} is not defined`);
  }
  return value || '';
};

// Validate required environment variables
export const validateEnv = () => {
  const required = ['VITE_API_URL'];
  const missing = required.filter((key) => !import.meta.env[key]);

  if (missing.length > 0) {
    console.error('Missing required environment variables:', missing);
    if (config.isProduction) {
      throw new Error(`Missing environment variables: ${missing.join(', ')}`);
    }
  }

  return missing.length === 0;
};

// Log configuration (only in development)
if (config.isDevelopment) {
  console.log('��� Application Configuration:', {
    api: config.api,
    app: config.app,
    features: config.features,
    ui: config.ui,
  });
}
