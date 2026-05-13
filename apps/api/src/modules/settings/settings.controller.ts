import {
  Controller, Get, Patch, Body, Req, Res, HttpStatus, UseGuards,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { SettingsService, GeneralSettings } from './settings.service';
import { TenantService } from '../tenants/tenant.service';
import { ActivityService } from '../activity/activity.service';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../audit/enums/audit-action.enum';
import { AuditTargetType } from '../audit/enums/audit-target.enum';
import { RbacGuard, RequirePermission } from '../../common/rbac/rbac.guard';

@Controller('settings')
@UseGuards(RbacGuard)
export class SettingsController {
  constructor(
    private readonly settings: SettingsService,
    private readonly tenants: TenantService,
    private readonly activity: ActivityService,
    private readonly audit: AuditService,
  ) {}

  @Get('general')
  async getGeneral(@Req() req: Request, @Res() res: Response): Promise<void> {
    const r = await this.settings.getGeneral(req.tenantId!);
    if (r.isErr()) {
      const status = r.error._tag === 'NotFoundError' ? 404 : 500;
      res.status(status).json({ error: r.error.message }); return;
    }
    res.json({ data: r.value });
  }

  @Patch('general')
  @RequirePermission('settings:general')
  async updateGeneral(
    @Body() body: Partial<GeneralSettings>,
    @Req() req: Request, @Res() res: Response,
  ): Promise<void> {
    // We need clerkOrgId to invalidate tenant cache; lookup from header is not exposed here.
    // Using a helper on TenantService is cleanest, but we accept it via request header.
    const clerkOrgId = (req.headers['x-org-id'] as string) ?? '';
    const r = await this.settings.updateGeneral(req.tenantId!, clerkOrgId, body);
    if (r.isErr()) {
      const status = r.error._tag === 'SettingsError' ? HttpStatus.BAD_REQUEST
        : r.error._tag === 'NotFoundError' ? 404 : 500;
      res.status(status).json({ error: r.error.message }); return;
    }
    await this.activity.log(req.tenantSchemaName!, {
      actorId: req.clerkUserId ?? null, action: 'SETTINGS_GENERAL_UPDATED',
      targetType: 'SETTINGS', targetId: req.tenantId ?? null, metadata: { changes: body },
    });
    await this.audit.log({
      tenantId: req.tenantId!, actorId: null,
      action: AuditAction.SETTINGS_GENERAL_UPDATED, targetType: AuditTargetType.SETTINGS,
      targetId: req.tenantId ?? null, metadata: { changes: body },
      ipAddress: null, userAgent: null,
    });
    // (TenantService methods unused here — kept import for future schema-name derivation.)
    void this.tenants;
    res.json({ data: r.value });
  }
}
