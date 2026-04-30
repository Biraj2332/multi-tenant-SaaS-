// Redis cache adapter interface
// Implement with the 'redis' package when ready

export interface CacheConfig {
  url: string;
  password?: string;
  ttl?: number;
}

export interface CacheAdapter {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;
  del(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
  flush(): Promise<void>;
}
