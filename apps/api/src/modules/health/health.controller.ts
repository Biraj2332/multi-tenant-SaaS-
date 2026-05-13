import { Controller, Get, Inject, Res, HttpStatus } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Response } from 'express';
import Redis from 'ioredis';

@Controller('health')
export class HealthController {
  constructor(
    @InjectDataSource() private readonly ds: DataSource,
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
  ) {}

  @Get()
  async check(@Res() res: Response): Promise<void> {
    res.json({ status: 'ok', uptime: process.uptime() });
  }

  @Get('ready')
  async ready(@Res() res: Response): Promise<void> {
    const checks = { db: false, redis: false };
    const dbOk = await this.ds.query('SELECT 1').then(() => true).catch(() => false);
    checks.db = dbOk;
    const redisOk = await this.redis.ping().then((r) => r === 'PONG').catch(() => false);
    checks.redis = redisOk;
    const ok = checks.db && checks.redis;
    res.status(ok ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE).json({ ok, checks });
  }

  @Get('live')
  live(@Res() res: Response): void {
    res.json({ ok: true });
  }
}
