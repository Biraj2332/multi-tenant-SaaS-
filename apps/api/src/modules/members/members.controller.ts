import {
  Controller, Get, Patch, Delete, Param, Body, Req, Res, HttpStatus, UseGuards,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { MembersService } from './members.service';
import { Role } from '../memberships/enums/role.enum';
import { ActivityService } from '../activity/activity.service';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../audit/enums/audit-action.enum';
import { AuditTargetType } from '../audit/enums/audit-target.enum';
import { RbacGuard, RequirePermission } from '../../common/rbac/rbac.guard';

@Controller('members')
@UseGuards(RbacGuard)
export class MembersController {
  constructor(
    private readonly members: MembersService,
    private readonly activity: ActivityService,
    private readonly audit: AuditService,
  ) {}

  @Get()
  async list(@Req() req: Request, @Res() res: Response): Promise<void> {
    const r = await this.members.listByTenant(req.tenantId!);
    if (r.isErr()) { res.status(500).json({ error: r.error.message }); return; }
    res.json({ data: r.value });
  }

  @Patch(':userId/role')
  @RequirePermission('member:role-change')
  async changeRole(
    @Param('userId') userId: string,
    @Body() body: { role: Role },
    @Req() req: Request, @Res() res: Response,
  ): Promise<void> {
    const r = await this.members.changeRole(
      req.tenantId!, req.clerkUserId ?? '', (req.membershipRole ?? Role.MEMBER) as Role,
      userId, body.role,
    );
    if (r.isErr()) {
      const status = r.error._tag === 'MemberError' ? HttpStatus.FORBIDDEN
        : r.error._tag === 'NotFoundError' ? HttpStatus.NOT_FOUND : 500;
      res.status(status).json({ error: r.error.message }); return;
    }
    await this.activity.log(req.tenantSchemaName!, {
      actorId: req.clerkUserId ?? null, action: 'MEMBER_ROLE_CHANGED',
      targetType: 'MEMBERSHIP', targetId: userId, metadata: { newRole: body.role },
    });
    await this.audit.log({
      tenantId: req.tenantId!, actorId: null, action: AuditAction.MEMBER_ROLE_CHANGED,
      targetType: AuditTargetType.MEMBERSHIP, targetId: userId,
      metadata: { newRole: body.role }, ipAddress: null, userAgent: null,
    });
    res.json({ data: r.value });
  }

  @Delete(':userId')
  @RequirePermission('member:remove')
  async remove(@Param('userId') userId: string, @Req() req: Request, @Res() res: Response): Promise<void> {
    const r = await this.members.remove(
      req.tenantId!, req.clerkUserId ?? '', (req.membershipRole ?? Role.MEMBER) as Role, userId,
    );
    if (r.isErr()) {
      const status = r.error._tag === 'MemberError' ? HttpStatus.FORBIDDEN
        : r.error._tag === 'NotFoundError' ? HttpStatus.NOT_FOUND : 500;
      res.status(status).json({ error: r.error.message }); return;
    }
    await this.activity.log(req.tenantSchemaName!, {
      actorId: req.clerkUserId ?? null, action: 'MEMBER_REMOVED',
      targetType: 'MEMBERSHIP', targetId: userId, metadata: {},
    });
    await this.audit.log({
      tenantId: req.tenantId!, actorId: null, action: AuditAction.MEMBER_REMOVED,
      targetType: AuditTargetType.MEMBERSHIP, targetId: userId,
      metadata: {}, ipAddress: null, userAgent: null,
    });
    res.status(HttpStatus.NO_CONTENT).send();
  }
}
