// Database adapter interface
// Implement with Prisma when ready

export interface DatabaseConfig {
  url: string;
  maxConnections?: number;
}

export interface DatabaseAdapter {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
}
