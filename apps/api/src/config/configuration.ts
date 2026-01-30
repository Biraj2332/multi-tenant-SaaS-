export default () => ({
  // Server Configuration
  port: Number.parseInt(process.env.PORT || '13000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  apiPrefix: process.env.API_PREFIX || 'api/v1',

  // Database Configuration
  database: {
    url: process.env.DATABASE_URL,
    maxConnections: Number.parseInt(process.env.DATABASE_MAX_CONNECTIONS || '10', 10),
  },

  // Redis Configuration
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    password: process.env.REDIS_PASSWORD,
  },

  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'development-secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  // Clerk Configuration
  clerk: {
    secretKey: process.env.CLERK_SECRET_KEY,
    publishableKey: process.env.CLERK_PUBLISHABLE_KEY,
    jwtKey: process.env.CLERK_JWT_KEY,
  },

  // Application URLs
  appUrl: process.env.APP_URL || 'http://localhost:5173',
  apiUrl: process.env.API_URL || 'http://localhost:1300',

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'debug',
    enableRequestLogging: process.env.ENABLE_REQUEST_LOGGING === 'true',
  },

  // Rate Limiting
  rateLimit: {
    windowMs: Number.parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    maxRequests: Number.parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },

  // CORS
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  },
});
