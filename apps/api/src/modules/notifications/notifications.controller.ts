import {
  Controller, Get, Post, Patch, Param, Body, Query, Req, Res, HttpStatus, UseGuards,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { NotificationsService } from './notifications.service';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../audit/enums/audit-action.enum';
import { AuditTargetType } from '../audit/enums/audit-target.enum';
import { RbacGuard } from '../../common/rbac/rbac.guard';

@Controller('notifications')
@UseGuards(RbacGuard)
export class NotificationsController {
  constructor(
    private readonly notif: NotificationsService,
    private readonly audit: AuditService,
  ) {}

  @Get()
  async list(
    @Query('unread') unread: string | undefined,
    @Req() req: Request, @Res() res: Response,
  ): Promise<void> {
    const userId = req.clerkUserId ?? '';
    const r = await this.notif.list(req.tenantSchemaName!, userId, unread === 'true');
    if (r.isErr()) { res.status(500).json({ error: r.error.message }); return; }
    res.json({ data: r.value });
  }

  @Get('unread-count')
  async unreadCount(@Req() req: Request, @Res() res: Response): Promise<void> {
    const r = await this.notif.unreadCount(req.tenantSchemaName!, req.tenantId!, req.clerkUserId ?? '');
    if (r.isErr()) { res.status(500).json({ error: r.error.message }); return; }
    res.json({ data: { count: r.value } });
  }

  @Patch(':id/read')
  async markRead(@Param('id') id: string, @Req() req: Request, @Res() res: Response): Promise<void> {
    const r = await this.notif.markRead(req.tenantSchemaName!, req.tenantId!, req.clerkUserId ?? '', id);
    if (r.isErr()) { res.status(500).json({ error: r.error.message }); return; }
    res.status(HttpStatus.NO_CONTENT).send();
  }

  @Post('mark-all-read')
  async markAllRead(@Req() req: Request, @Res() res: Response): Promise<void> {
    const r = await this.notif.markAllRead(req.tenantSchemaName!, req.tenantId!, req.clerkUserId ?? '');
    if (r.isErr()) { res.status(500).json({ error: r.error.message }); return; }
    res.status(HttpStatus.NO_CONTENT).send();
  }

  @Get('preferences')
  async getPrefs(@Req() req: Request, @Res() res: Response): Promise<void> {
    const r = await this.notif.getPreferences(req.tenantSchemaName!, req.tenantId!, req.clerkUserId ?? '');
    if (r.isErr()) { res.status(500).json({ error: r.error.message }); return; }
    res.json({ data: r.value });
  }

  @Post('preferences')
  async upsertPref(
    @Body() body: {
      category: string;
      emailEnabled?: boolean;
      inAppEnabled?: boolean;
      quietHoursStart?: string | null;
      quietHoursEnd?: string | null;
    },
    @Req() req: Request, @Res() res: Response,
  ): Promise<void> {
    const r = await this.notif.upsertPreference(
      req.tenantSchemaName!, req.tenantId!, req.clerkUserId ?? '', body,
    );
    if (r.isErr()) { res.status(500).json({ error: r.error.message }); return; }
    await this.audit.log({
      tenantId: req.tenantId!, actorId: null, action: AuditAction.NOTIFICATION_PREFS_UPDATED,
      targetType: AuditTargetType.SETTINGS, targetId: null,
      metadata: { category: body.category }, ipAddress: null, userAgent: null,
    });
    res.json({ data: r.value });
  }
}
