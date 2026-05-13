import {
  Controller, Get, Post, Param, Body, Query, Req, Res, HttpStatus, UseGuards,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { SprintsService, CreateSprintDto } from './sprints.service';
import { ActivityService } from '../activity/activity.service';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../audit/enums/audit-action.enum';
import { AuditTargetType } from '../audit/enums/audit-target.enum';
import { RbacGuard, RequirePermission } from '../../common/rbac/rbac.guard';

@Controller('sprints')
@UseGuards(RbacGuard)
export class SprintsController {
  constructor(
    private readonly sprints: SprintsService,
    private readonly activity: ActivityService,
    private readonly audit: AuditService,
  ) {}

  @Get()
  async list(@Query('projectId') projectId: string, @Req() req: Request, @Res() res: Response): Promise<void> {
    const r = await this.sprints.findByProject(req.tenantSchemaName!, req.tenantId!, projectId);
    if (r.isErr()) { res.status(500).json({ error: r.error.message }); return; }
    res.json({ data: r.value });
  }

  @Get('active')
  async active(@Query('projectId') projectId: string, @Req() req: Request, @Res() res: Response): Promise<void> {
    const r = await this.sprints.getActive(req.tenantSchemaName!, req.tenantId!, projectId);
    if (r.isErr()) { res.status(500).json({ error: r.error.message }); return; }
    res.json({ data: r.value });
  }

  @Post()
  @RequirePermission('sprint:manage')
  async create(@Body() dto: CreateSprintDto, @Req() req: Request, @Res() res: Response): Promise<void> {
    const r = await this.sprints.create(req.tenantSchemaName!, req.tenantId!, dto);
    if (r.isErr()) { res.status(500).json({ error: r.error.message }); return; }
    await this.activity.log(req.tenantSchemaName!, {
      actorId: req.clerkUserId ?? null, action: 'SPRINT_CREATED',
      targetType: 'SPRINT', targetId: r.value.id, metadata: { name: dto.name },
    });
    await this.audit.log({
      tenantId: req.tenantId!, actorId: null,
      action: AuditAction.SPRINT_CREATED, targetType: AuditTargetType.SPRINT,
      targetId: r.value.id, metadata: { name: dto.name },
      ipAddress: null, userAgent: null,
    });
    res.status(HttpStatus.CREATED).json({ data: r.value });
  }

  @Post(':id/start')
  @RequirePermission('sprint:manage')
  async start(@Param('id') id: string, @Req() req: Request, @Res() res: Response): Promise<void> {
    const r = await this.sprints.start(req.tenantSchemaName!, req.tenantId!, id);
    if (r.isErr()) {
      const status = r.error._tag === 'SprintError' ? HttpStatus.CONFLICT
        : r.error._tag === 'NotFoundError' ? HttpStatus.NOT_FOUND : 500;
      res.status(status).json({ error: r.error.message }); return;
    }
    await this.activity.log(req.tenantSchemaName!, {
      actorId: req.clerkUserId ?? null, action: 'SPRINT_STARTED',
      targetType: 'SPRINT', targetId: id, metadata: {},
    });
    res.json({ data: r.value });
  }

  @Post(':id/complete')
  @RequirePermission('sprint:manage')
  async complete(@Param('id') id: string, @Req() req: Request, @Res() res: Response): Promise<void> {
    const r = await this.sprints.complete(req.tenantSchemaName!, req.tenantId!, id);
    if (r.isErr()) {
      const status = r.error._tag === 'SprintError' ? HttpStatus.CONFLICT : 500;
      res.status(status).json({ error: r.error.message }); return;
    }
    await this.activity.log(req.tenantSchemaName!, {
      actorId: req.clerkUserId ?? null, action: 'SPRINT_COMPLETED',
      targetType: 'SPRINT', targetId: id, metadata: {},
    });
    res.json({ data: r.value });
  }
}
