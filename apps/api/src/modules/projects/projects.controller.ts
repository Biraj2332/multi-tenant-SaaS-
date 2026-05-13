import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Req, Res, HttpStatus, UseGuards,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ProjectsService, CreateProjectDto, UpdateProjectDto } from './projects.service';
import { ActivityService } from '../activity/activity.service';
import { RolesGuard, Roles } from '../../common/guards/roles.guard';
import { Role } from '../memberships/enums/role.enum';

@Controller('projects')
@UseGuards(RolesGuard)
export class ProjectsController {
  constructor(
    private readonly projects: ProjectsService,
    private readonly activity: ActivityService,
  ) {}

  @Get()
  @Roles(Role.VIEWER)
  async findAll(@Req() req: Request, @Res() res: Response): Promise<void> {
    const result = await this.projects.findAll(req.tenantSchemaName!, req.tenantId!);
    if (result.isErr()) { res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: result.error.message }); return; }
    res.json({ data: result.value });
  }

  @Get(':id')
  @Roles(Role.VIEWER)
  async findOne(@Param('id') id: string, @Req() req: Request, @Res() res: Response): Promise<void> {
    const result = await this.projects.findOne(req.tenantSchemaName!, req.tenantId!, id);
    if (result.isErr()) {
      const status = result.error._tag === 'NotFoundError' ? HttpStatus.NOT_FOUND : HttpStatus.INTERNAL_SERVER_ERROR;
      res.status(status).json({ error: result.error.message }); return;
    }
    res.json({ data: result.value });
  }

  @Post()
  @Roles(Role.MEMBER)
  async create(@Body() dto: CreateProjectDto, @Req() req: Request, @Res() res: Response): Promise<void> {
    const result = await this.projects.create(
      req.tenantSchemaName!, req.tenantId!, dto, req.clerkUserId ?? 'unknown',
    );
    if (result.isErr()) { res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: result.error.message }); return; }

    await this.activity.log(req.tenantSchemaName!, {
      actorId: req.clerkUserId ?? null,
      action: 'PROJECT_CREATED',
      targetType: 'PROJECT',
      targetId: result.value.id,
      metadata: { name: dto.name, shortCode: dto.shortCode },
    });

    res.status(HttpStatus.CREATED).json({ data: result.value });
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  async update(
    @Param('id') id: string, @Body() dto: UpdateProjectDto,
    @Req() req: Request, @Res() res: Response,
  ): Promise<void> {
    const result = await this.projects.update(req.tenantSchemaName!, req.tenantId!, id, dto);
    if (result.isErr()) {
      const status = result.error._tag === 'NotFoundError' ? HttpStatus.NOT_FOUND : HttpStatus.INTERNAL_SERVER_ERROR;
      res.status(status).json({ error: result.error.message }); return;
    }

    await this.activity.log(req.tenantSchemaName!, {
      actorId: req.clerkUserId ?? null,
      action: 'PROJECT_UPDATED',
      targetType: 'PROJECT',
      targetId: id,
      metadata: { changes: dto },
    });

    res.json({ data: result.value });
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  async remove(@Param('id') id: string, @Req() req: Request, @Res() res: Response): Promise<void> {
    const result = await this.projects.remove(req.tenantSchemaName!, req.tenantId!, id);
    if (result.isErr()) { res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: result.error.message }); return; }

    await this.activity.log(req.tenantSchemaName!, {
      actorId: req.clerkUserId ?? null,
      action: 'PROJECT_DELETED',
      targetType: 'PROJECT',
      targetId: id,
    });

    res.status(HttpStatus.NO_CONTENT).send();
  }

  @Patch(':id/archive')
  @Roles(Role.ADMIN)
  async archive(@Param('id') id: string, @Req() req: Request, @Res() res: Response): Promise<void> {
    const result = await this.projects.archive(req.tenantSchemaName!, req.tenantId!, id);
    if (result.isErr()) {
      const status = result.error._tag === 'NotFoundError' ? HttpStatus.NOT_FOUND : HttpStatus.INTERNAL_SERVER_ERROR;
      res.status(status).json({ error: result.error.message }); return;
    }

    await this.activity.log(req.tenantSchemaName!, {
      actorId: req.clerkUserId ?? null,
      action: 'PROJECT_ARCHIVED',
      targetType: 'PROJECT',
      targetId: id,
    });

    res.json({ data: result.value });
  }
}
