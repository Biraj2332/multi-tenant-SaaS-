import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Result, ok, err } from 'neverthrow';
import { NotifError, DatabaseError } from '../../common/errors/app.errors';
import { withTenantSchemaResult } from '../../common/helpers/tenant-query';
import { RedisService } from '../redis/redis.service';
import { CacheKey, CacheTTL } from '../redis/redis.types';

export interface NotificationRow {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string | null;
  resource_type: string | null;
  resource_id: string | null;
  read_at: string | null;
  created_at: string;
}

export interface NotifPrefRow {
  id: string;
  user_id: string;
  category: string;
  email_enabled: boolean;
  in_app_enabled: boolean;
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
  updated_at: string;
}

export interface CreateNotifDto {
  userId: string;
  type?: string;
  title: string;
  body?: string;
  resourceType?: string;
  resourceId?: string;
}

function isInQuietHours(start: string | null, end: string | null, now = new Date()): boolean {
  if (!start || !end) return false;
  const toMin = (s: string) => {
    const [h, m] = s.split(':').map(Number);
    return h * 60 + (m ?? 0);
  };
  const cur = now.getUTCHours() * 60 + now.getUTCMinutes();
  const s = toMin(start);
  const e = toMin(end);
  return s <= e ? cur >= s && cur < e : cur >= s || cur < e;
}

@Injectable()
export class NotificationsService {
  constructor(
    @InjectDataSource() private readonly ds: DataSource,
    private readonly redis: RedisService,
  ) {}

  async list(
    schemaName: string,
    userId: string,
    onlyUnread = false,
  ): Promise<Result<NotificationRow[], DatabaseError>> {
    return withTenantSchemaResult(this.ds, schemaName, async (qr) => {
      const where = onlyUnread ? `user_id = $1 AND read_at IS NULL` : `user_id = $1`;
      const rows: NotificationRow[] = await qr.query(
        `SELECT * FROM notifications WHERE ${where} ORDER BY created_at DESC LIMIT 50`,
        [userId],
      );
      return rows;
    });
  }

  async unreadCount(
    schemaName: string,
    tenantId: string,
    userId: string,
  ): Promise<Result<number, DatabaseError>> {
    const key = CacheKey.unreadCount(tenantId, userId);
    const cached = await this.redis.get<number>(key);
    if (cached.isOk() && cached.value !== null) return ok(cached.value);

    const result = await withTenantSchemaResult(this.ds, schemaName, async (qr) => {
      const rows: Array<{ count: string }> = await qr.query(
        `SELECT COUNT(*)::text AS count FROM notifications WHERE user_id = $1 AND read_at IS NULL`,
        [userId],
      );
      return Number(rows[0]?.count ?? 0);
    });
    if (result.isOk()) await this.redis.set(key, result.value, CacheTTL.UNREAD_COUNT);
    return result;
  }

  async create(
    schemaName: string,
    tenantId: string,
    dto: CreateNotifDto,
  ): Promise<Result<NotificationRow | null, NotifError | DatabaseError>> {
    // Check quiet hours
    const prefResult = await this.getPreferences(schemaName, tenantId, dto.userId);
    if (prefResult.isOk()) {
      const pref = prefResult.value.find((p) => p.category === (dto.type ?? 'system'));
      if (pref && !pref.in_app_enabled) return ok(null);
      if (pref && isInQuietHours(pref.quiet_hours_start, pref.quiet_hours_end)) {
        // Suppress in-app during quiet hours
        return ok(null);
      }
    }

    const result = await withTenantSchemaResult(this.ds, schemaName, async (qr) => {
      const rows: NotificationRow[] = await qr.query(
        `INSERT INTO notifications (user_id, type, title, body, resource_type, resource_id)
         VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
        [
          dto.userId, dto.type ?? 'system', dto.title, dto.body ?? null,
          dto.resourceType ?? null, dto.resourceId ?? null,
        ],
      );
      return rows[0];
    });
    if (result.isOk()) await this.redis.del(CacheKey.unreadCount(tenantId, dto.userId));
    return result;
  }

  async markRead(
    schemaName: string,
    tenantId: string,
    userId: string,
    notifId: string,
  ): Promise<Result<void, DatabaseError>> {
    const result = await withTenantSchemaResult(this.ds, schemaName, async (qr) => {
      await qr.query(
        `UPDATE notifications SET read_at = NOW() WHERE id = $1 AND user_id = $2 AND read_at IS NULL`,
        [notifId, userId],
      );
    });
    if (result.isOk()) await this.redis.del(CacheKey.unreadCount(tenantId, userId));
    return result;
  }

  async markAllRead(
    schemaName: string,
    tenantId: string,
    userId: string,
  ): Promise<Result<void, DatabaseError>> {
    const result = await withTenantSchemaResult(this.ds, schemaName, async (qr) => {
      await qr.query(
        `UPDATE notifications SET read_at = NOW() WHERE user_id = $1 AND read_at IS NULL`,
        [userId],
      );
    });
    if (result.isOk()) await this.redis.del(CacheKey.unreadCount(tenantId, userId));
    return result;
  }

  async getPreferences(
    schemaName: string,
    tenantId: string,
    userId: string,
  ): Promise<Result<NotifPrefRow[], DatabaseError>> {
    const key = CacheKey.notifPrefs(tenantId, userId);
    const cached = await this.redis.get<NotifPrefRow[]>(key);
    if (cached.isOk() && cached.value !== null) return ok(cached.value);

    const result = await withTenantSchemaResult(this.ds, schemaName, async (qr) => {
      const rows: NotifPrefRow[] = await qr.query(
        `SELECT * FROM notification_preferences WHERE user_id = $1`,
        [userId],
      );
      return rows;
    });
    if (result.isOk()) await this.redis.set(key, result.value, CacheTTL.NOTIF_PREFS);
    return result;
  }

  async upsertPreference(
    schemaName: string,
    tenantId: string,
    userId: string,
    pref: {
      category: string;
      emailEnabled?: boolean;
      inAppEnabled?: boolean;
      quietHoursStart?: string | null;
      quietHoursEnd?: string | null;
    },
  ): Promise<Result<NotifPrefRow, DatabaseError>> {
    const result = await withTenantSchemaResult(this.ds, schemaName, async (qr) => {
      const rows: NotifPrefRow[] = await qr.query(
        `INSERT INTO notification_preferences (user_id, category, email_enabled, in_app_enabled, quiet_hours_start, quiet_hours_end)
         VALUES ($1,$2,$3,$4,$5,$6)
         ON CONFLICT (user_id, category) DO UPDATE SET
           email_enabled = EXCLUDED.email_enabled,
           in_app_enabled = EXCLUDED.in_app_enabled,
           quiet_hours_start = EXCLUDED.quiet_hours_start,
           quiet_hours_end = EXCLUDED.quiet_hours_end,
           updated_at = NOW()
         RETURNING *`,
        [
          userId, pref.category,
          pref.emailEnabled ?? true, pref.inAppEnabled ?? true,
          pref.quietHoursStart ?? null, pref.quietHoursEnd ?? null,
        ],
      );
      return rows[0];
    });
    if (result.isOk()) await this.redis.del(CacheKey.notifPrefs(tenantId, userId));
    return result;
  }
}
