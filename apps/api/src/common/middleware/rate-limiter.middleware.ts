import { Injectable, NestMiddleware, Inject, HttpStatus } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import Redis from 'ioredis';

interface PlanLimit { capacity: number; refillPerSec: number; }

const PLAN_LIMITS: Record<string, PlanLimit> = {
  starter:    { capacity: 60,  refillPerSec: 1 },
  pro:        { capacity: 300, refillPerSec: 5 },
  enterprise: { capacity: 1200, refillPerSec: 20 },
};

/**
 * Token-bucket rate limiter per tenant (Redis-backed).
 * Lua-free implementation using INCR + PEXPIRE for fixed-window equivalent.
 */
@Injectable()
export class RateLimiterMiddleware implements NestMiddleware {
  constructor(@Inject('REDIS_CLIENT') private readonly redis: Redis) {}

  async use(req: Request, res: Response, next: NextFunction): Promise<void> {
    const tenantId = req.tenantId;
    if (!tenantId) { next(); return; }
    const plan = (req.tenantPlan ?? 'starter').toLowerCase();
    const limit = PLAN_LIMITS[plan] ?? PLAN_LIMITS.starter;

    // Fixed-window: capacity per minute (capacity-based budget)
    const window = Math.floor(Date.now() / 60_000);
    const key = `rate:${tenantId}:${window}`;

    const count = await this.redis.incr(key).catch(() => 0);
    if (count === 1) await this.redis.expire(key, 90).catch(() => 0);

    if (count > limit.capacity) {
      const retryAfter = 60 - Math.floor((Date.now() % 60_000) / 1000);
      res.setHeader('Retry-After', String(retryAfter));
      res.setHeader('X-RateLimit-Limit', String(limit.capacity));
      res.setHeader('X-RateLimit-Remaining', '0');
      res
        .status(HttpStatus.TOO_MANY_REQUESTS)
        .json({ error: 'Rate limit exceeded', retryAfter });
      return;
    }

    res.setHeader('X-RateLimit-Limit', String(limit.capacity));
    res.setHeader('X-RateLimit-Remaining', String(Math.max(0, limit.capacity - count)));
    next();
  }
}
