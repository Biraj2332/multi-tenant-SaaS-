import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Query, Req, Res, HttpStatus, UseGuards,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { TasksService, CreateTaskDto, UpdateTaskDto } from './tasks.service';
import { CommentsService } from '../comments/comments.service';
import { ActivityService } from '../activity/activity.service';
import { RolesGuard, Roles } from '../../common/guards/roles.guard';
import { Role } from '../memberships/enums/role.enum';

@Controller('tasks')
@UseGuards(RolesGuard)
export class TasksController {
  constructor(
    private readonly tasks: TasksService,
    private readonly comments: CommentsService,
    private readonly activity: ActivityService,
  ) {}

  @Get()
  @Roles(Role.VIEWER)
  async findAll(
    @Query('projectId') projectId: string,
    @Query('status') status: string | undefined,
    @Query('assigneeId') assigneeId: string | undefined,
    @Req() req: Request, @Res() res: Response,
  ): Promise<void> {
    if (!projectId) { res.status(HttpStatus.BAD_REQUEST).json({ error: 'projectId is required' }); return; }

    const result = await this.tasks.findAll(req.tenantSchemaName!, req.tenantId!, {
      projectId,
      status: status || undefined,
      assigneeId: assigneeId || undefined,
    });

    if (result.isErr()) { res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: result.error.message }); return; }
    res.json({ data: result.value });
  }

  @Get(':id')
  @Roles(Role.VIEWER)
  async findOne(@Param('id') id: string, @Req() req: Request, @Res() res: Response): Promise<void> {
    const result = await this.tasks.findOne(req.tenantSchemaName!, id);
    if (result.isErr()) {
      const status = result.error._tag === 'NotFoundError' ? HttpStatus.NOT_FOUND : HttpStatus.INTERNAL_SERVER_ERROR;
      res.status(status).json({ error: result.error.message }); return;
    }
    res.json({ data: result.value });
  }

  @Post()
  @Roles(Role.MEMBER)
  async create(@Body() dto: CreateTaskDto, @Req() req: Request, @Res() res: Response): Promise<void> {
    const result = await this.tasks.create(
      req.tenantSchemaName!, req.tenantId!, dto, req.clerkUserId ?? 'unknown',
    );
    if (result.isErr()) { res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: result.error.message }); return; }

    await this.activity.log(req.tenantSchemaName!, {
      actorId: req.clerkUserId ?? null,
      action: 'TASK_CREATED',
      targetType: 'TASK',
      targetId: result.value.id,
      metadata: { title: dto.title, projectId: dto.projectId },
    });

    res.status(HttpStatus.CREATED).json({ data: result.value });
  }

  @Patch(':id')
  @Roles(Role.MEMBER)
  async update(
    @Param('id') id: string, @Body() dto: UpdateTaskDto,
    @Req() req: Request, @Res() res: Response,
  ): Promise<void> {
    const result = await this.tasks.update(req.tenantSchemaName!, req.tenantId!, id, dto);
    if (result.isErr()) {
      const st = result.error._tag === 'NotFoundError' ? HttpStatus.NOT_FOUND : HttpStatus.INTERNAL_SERVER_ERROR;
      res.status(st).json({ error: result.error.message }); return;
    }

    const { task, oldStatus } = result.value;

    // Log status change specifically
    if (oldStatus !== undefined) {
      await this.activity.log(req.tenantSchemaName!, {
        actorId: req.clerkUserId ?? null,
        action: 'TASK_STATUS_CHANGED',
        targetType: 'TASK',
        targetId: id,
        metadata: { from: oldStatus, to: task.status },
      });
    } else {
      await this.activity.log(req.tenantSchemaName!, {
        actorId: req.clerkUserId ?? null,
        action: 'TASK_UPDATED',
        targetType: 'TASK',
        targetId: id,
        metadata: { changes: dto },
      });
    }

    if (dto.assigneeId !== undefined) {
      await this.activity.log(req.tenantSchemaName!, {
        actorId: req.clerkUserId ?? null,
        action: 'TASK_ASSIGNED',
        targetType: 'TASK',
        targetId: id,
        metadata: { assigneeId: dto.assigneeId },
      });
    }

    res.json({ data: task });
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  async remove(@Param('id') id: string, @Req() req: Request, @Res() res: Response): Promise<void> {
    const result = await this.tasks.remove(req.tenantSchemaName!, req.tenantId!, id);
    if (result.isErr()) {
      const st = result.error._tag === 'NotFoundError' ? HttpStatus.NOT_FOUND : HttpStatus.INTERNAL_SERVER_ERROR;
      res.status(st).json({ error: result.error.message }); return;
    }

    await this.activity.log(req.tenantSchemaName!, {
      actorId: req.clerkUserId ?? null,
      action: 'TASK_DELETED',
      targetType: 'TASK',
      targetId: id,
    });

    res.status(HttpStatus.NO_CONTENT).send();
  }

  // --- Comments sub-resource ---

  @Get(':id/comments')
  @Roles(Role.VIEWER)
  async getComments(@Param('id') id: string, @Req() req: Request, @Res() res: Response): Promise<void> {
    const result = await this.comments.findByTask(req.tenantSchemaName!, id);
    if (result.isErr()) { res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: result.error.message }); return; }
    res.json({ data: result.value });
  }

  @Post(':id/comments')
  @Roles(Role.MEMBER)
  async addComment(
    @Param('id') id: string, @Body() body: { body: string },
    @Req() req: Request, @Res() res: Response,
  ): Promise<void> {
    if (!body.body?.trim()) { res.status(HttpStatus.BAD_REQUEST).json({ error: 'body is required' }); return; }

    const result = await this.comments.create(
      req.tenantSchemaName!, id, req.clerkUserId ?? 'unknown', body.body.trim(),
    );
    if (result.isErr()) { res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: result.error.message }); return; }

    await this.activity.log(req.tenantSchemaName!, {
      actorId: req.clerkUserId ?? null,
      action: 'COMMENT_CREATED',
      targetType: 'TASK',
      targetId: id,
      metadata: { commentId: result.value.id },
    });

    res.status(HttpStatus.CREATED).json({ data: result.value });
  }

  // --- Activity sub-resource ---

  @Get(':id/activity')
  @Roles(Role.VIEWER)
  async getActivity(@Param('id') id: string, @Req() req: Request, @Res() res: Response): Promise<void> {
    const result = await this.activity.findByEntity(req.tenantSchemaName!, id);
    if (result.isErr()) { res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: result.error.message }); return; }
    res.json({ data: result.value });
  }
}
