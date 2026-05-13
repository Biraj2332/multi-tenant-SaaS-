import {
  Controller, Get, Post, Patch, Delete, Param, Body, Query, Req, Res, HttpStatus, UseGuards,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { IssuesService, CreateIssueDto, IssueRow } from './issues.service';
import { ActivityService } from '../activity/activity.service';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../audit/enums/audit-action.enum';
import { AuditTargetType } from '../audit/enums/audit-target.enum';
import { RbacGuard, RequirePermission } from '../../common/rbac/rbac.guard';

@Controller('issues')
@UseGuards(RbacGuard)
export class IssuesController {
  constructor(
    private readonly issues: IssuesService,
    private readonly activity: ActivityService,
    private readonly audit: AuditService,
  ) {}

  @Get()
  async list(
    @Query('projectId') projectId: string | undefined,
    @Query('type') type: string | undefined,
    @Query('status') status: string | undefined,
    @Query('sprintId') sprintId: string | undefined,
    @Req() req: Request, @Res() res: Response,
  ): Promise<void> {
    const r = await this.issues.findAll(req.tenantSchemaName!, req.tenantId!, {
      projectId, type: type as never, status: status as never, sprintId: sprintId as never,
    });
    if (r.isErr()) { res.status(500).json({ error: r.error.message }); return; }
    res.json({ data: r.value });
  }

  @Post()
  @RequirePermission('issue:create')
  async create(@Body() dto: CreateIssueDto, @Req() req: Request, @Res() res: Response): Promise<void> {
    const r = await this.issues.create(req.tenantSchemaName!, req.tenantId!, dto, req.clerkUserId ?? 'unknown');
    if (r.isErr()) { res.status(500).json({ error: r.error.message }); return; }
    const action = dto.type === 'BUG' ? AuditAction.BUG_REPORTED : AuditAction.ISSUE_CREATED;
    await this.activity.log(req.tenantSchemaName!, {
      actorId: req.clerkUserId ?? null, action: action,
      targetType: 'ISSUE', targetId: r.value.id, metadata: { type: dto.type, severity: dto.severity },
    });
    await this.audit.log({
      tenantId: req.tenantId!, actorId: null, action, targetType: AuditTargetType.ISSUE,
      targetId: r.value.id, metadata: { title: dto.title, severity: dto.severity },
      ipAddress: null, userAgent: null,
    });
    res.status(HttpStatus.CREATED).json({ data: r.value });
  }

  @Patch(':id')
  async update(
    @Param('id') id: string, @Body() dto: Partial<IssueRow>,
    @Req() req: Request, @Res() res: Response,
  ): Promise<void> {
    const r = await this.issues.update(req.tenantSchemaName!, req.tenantId!, id, dto);
    if (r.isErr()) {
      const status = r.error._tag === 'NotFoundError' ? HttpStatus.NOT_FOUND : 500;
      res.status(status).json({ error: r.error.message }); return;
    }
    await this.activity.log(req.tenantSchemaName!, {
      actorId: req.clerkUserId ?? null, action: 'ISSUE_UPDATED',
      targetType: 'ISSUE', targetId: id, metadata: { changes: dto },
    });
    res.json({ data: r.value });
  }

  @Post('bulk-move')
  @RequirePermission('issue:bulk-move')
  async bulkMove(
    @Body() body: { issueIds: string[]; sprintId: string | null },
    @Req() req: Request, @Res() res: Response,
  ): Promise<void> {
    const r = await this.issues.bulkMoveToSprint(
      req.tenantSchemaName!, req.tenantId!, body.issueIds, body.sprintId,
    );
    if (r.isErr()) { res.status(500).json({ error: r.error.message }); return; }
    await this.activity.log(req.tenantSchemaName!, {
      actorId: req.clerkUserId ?? null, action: 'ISSUE_BULK_MOVED',
      targetType: 'ISSUE', targetId: null,
      metadata: { count: r.value, sprintId: body.sprintId, ids: body.issueIds },
    });
    res.json({ data: { moved: r.value } });
  }

  @Delete(':id')
  @RequirePermission('task:delete')
  async remove(@Param('id') id: string, @Req() req: Request, @Res() res: Response): Promise<void> {
    const r = await this.issues.remove(req.tenantSchemaName!, req.tenantId!, id);
    if (r.isErr()) { res.status(500).json({ error: r.error.message }); return; }
    await this.activity.log(req.tenantSchemaName!, {
      actorId: req.clerkUserId ?? null, action: 'ISSUE_DELETED',
      targetType: 'ISSUE', targetId: id, metadata: {},
    });
    res.status(HttpStatus.NO_CONTENT).send();
  }
}
