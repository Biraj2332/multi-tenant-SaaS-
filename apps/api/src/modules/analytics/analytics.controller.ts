import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { Request, Response } from 'express';
import { AnalyticsService } from './analytics.service';
import { RbacGuard, RequirePermission } from '../../common/rbac/rbac.guard';

@Controller('analytics')
@UseGuards(RbacGuard)
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  @Get('summary')
  @RequirePermission('analytics:view')
  async summary(@Req() req: Request, @Res() res: Response): Promise<void> {
    const r = await this.analytics.summary(req.tenantSchemaName!, req.tenantId!);
    if (r.isErr()) { res.status(500).json({ error: r.error.message }); return; }
    res.json({ data: r.value });
  }

  @Get('task-trend')
  @RequirePermission('analytics:view')
  async trend(@Req() req: Request, @Res() res: Response): Promise<void> {
    const r = await this.analytics.taskTrend(req.tenantSchemaName!, req.tenantId!);
    if (r.isErr()) { res.status(500).json({ error: r.error.message }); return; }
    res.json({ data: r.value });
  }

  @Get('priority-dist')
  @RequirePermission('analytics:view')
  async priority(@Req() req: Request, @Res() res: Response): Promise<void> {
    const r = await this.analytics.priorityDistribution(req.tenantSchemaName!, req.tenantId!);
    if (r.isErr()) { res.status(500).json({ error: r.error.message }); return; }
    res.json({ data: r.value });
  }

  @Get('sprint-velocity')
  @RequirePermission('analytics:view')
  async velocity(@Req() req: Request, @Res() res: Response): Promise<void> {
    const r = await this.analytics.sprintVelocity(req.tenantSchemaName!, req.tenantId!);
    if (r.isErr()) { res.status(500).json({ error: r.error.message }); return; }
    res.json({ data: r.value });
  }
}
