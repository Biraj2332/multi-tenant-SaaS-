import { randomUUID } from 'crypto';

export interface LogEntry {
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  traceId: string;
  tenantId?: string;
  actorId?: string;
  meta?: Record<string, unknown>;
  timestamp: string;
}

export class Logger {
  private readonly base: { service: string; env: string };

  constructor(service: string, env: string = process.env.NODE_ENV ?? 'development') {
    this.base = { service, env };
  }

  newTraceId(): string { return randomUUID(); }

  private write(entry: LogEntry): void {
    const line = JSON.stringify({ ...this.base, ...entry });
    if (entry.level === 'error') process.stderr.write(line + '\n');
    else process.stdout.write(line + '\n');
  }

  info(message: string, ctx: Partial<Omit<LogEntry, 'level' | 'message' | 'timestamp'>> = {}): void {
    this.write({ level: 'info', message, traceId: ctx.traceId ?? this.newTraceId(), tenantId: ctx.tenantId, actorId: ctx.actorId, meta: ctx.meta, timestamp: new Date().toISOString() });
  }
  warn(message: string, ctx: Partial<Omit<LogEntry, 'level' | 'message' | 'timestamp'>> = {}): void {
    this.write({ level: 'warn', message, traceId: ctx.traceId ?? this.newTraceId(), tenantId: ctx.tenantId, actorId: ctx.actorId, meta: ctx.meta, timestamp: new Date().toISOString() });
  }
  error(message: string, ctx: Partial<Omit<LogEntry, 'level' | 'message' | 'timestamp'>> = {}): void {
    this.write({ level: 'error', message, traceId: ctx.traceId ?? this.newTraceId(), tenantId: ctx.tenantId, actorId: ctx.actorId, meta: ctx.meta, timestamp: new Date().toISOString() });
  }
  debug(message: string, ctx: Partial<Omit<LogEntry, 'level' | 'message' | 'timestamp'>> = {}): void {
    if (this.base.env === 'production') return;
    this.write({ level: 'debug', message, traceId: ctx.traceId ?? this.newTraceId(), tenantId: ctx.tenantId, actorId: ctx.actorId, meta: ctx.meta, timestamp: new Date().toISOString() });
  }
}

export const appLogger = new Logger('tenantops-api');
