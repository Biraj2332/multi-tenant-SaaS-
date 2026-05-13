import { Injectable, Inject, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import { Result, ok, err } from 'neverthrow';
import { RedisError } from '../../common/errors/app.errors';
import { TypedRedisClient } from './redis.types';

@Injectable()
export class RedisService implements TypedRedisClient, OnModuleDestroy {
  constructor(@Inject('REDIS_CLIENT') private readonly redis: Redis) {}

  async get<T>(key: string): Promise<Result<T | null, RedisError>> {
    const raw = await this.redis.get(key).catch((e: unknown) => e);
    if (raw instanceof Error) {
      return err(new RedisError(`Redis GET failed for key "${key}"`, raw));
    }
    if (raw === null || raw === undefined) return ok(null);
    const parsed = Result.fromThrowable(
      () => JSON.parse(raw as string) as T,
      (e) => new RedisError(`Redis parse failed for key "${key}"`, e),
    )();
    return parsed;
  }

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<Result<void, RedisError>> {
    const serialized = Result.fromThrowable(
      () => JSON.stringify(value),
      (e) => new RedisError(`Redis serialize failed for key "${key}"`, e),
    )();
    if (serialized.isErr()) return err(serialized.error);
    const res = await this.redis.set(key, serialized.value, 'EX', ttlSeconds).catch((e: unknown) => e);
    if (res instanceof Error) {
      return err(new RedisError(`Redis SET failed for key "${key}"`, res));
    }
    return ok(undefined);
  }

  async del(key: string): Promise<Result<void, RedisError>> {
    const res = await this.redis.del(key).catch((e: unknown) => e);
    if (res instanceof Error) {
      return err(new RedisError(`Redis DEL failed for key "${key}"`, res));
    }
    return ok(undefined);
  }

  async exists(key: string): Promise<Result<boolean, RedisError>> {
    const res = await this.redis.exists(key).catch((e: unknown) => e);
    if (res instanceof Error) {
      return err(new RedisError(`Redis EXISTS failed for key "${key}"`, res));
    }
    return ok((res as number) > 0);
  }

  async delByPrefix(prefix: string): Promise<Result<void, RedisError>> {
    const keys = await this.redis.keys(`${prefix}*`).catch((e: unknown) => e);
    if (keys instanceof Error) {
      return err(new RedisError(`Redis KEYS failed for prefix "${prefix}"`, keys));
    }
    if ((keys as string[]).length > 0) {
      const res = await this.redis.del(...(keys as string[])).catch((e: unknown) => e);
      if (res instanceof Error) {
        return err(new RedisError(`Redis DEL failed for prefix "${prefix}"`, res));
      }
    }
    return ok(undefined);
  }

  async onModuleDestroy(): Promise<void> {
    await this.redis.quit();
  }
}
