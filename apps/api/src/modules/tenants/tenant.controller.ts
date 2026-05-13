import { Controller, Get, Post, Param, Req, Res, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { TenantService } from './tenant.service';

@Controller('orgs')
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  /** GET /orgs/mine — returns the calling user's organizations */
  @Get('mine')
  async getMyOrgs(@Req() req: Request, @Res() res: Response): Promise<void> {
    // Clerk userId comes from the auth token — for now we read from the header
    const clerkUserId = req.headers['x-clerk-user-id'] as string | undefined;

    if (!clerkUserId) {
      res.status(HttpStatus.UNAUTHORIZED).json({ error: 'Missing x-clerk-user-id header' });
      return;
    }

    const result = await this.tenantService.getUserOrgs(clerkUserId);

    if (result.isErr()) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: result.error.message });
      return;
    }

    res.status(HttpStatus.OK).json({ data: result.value });
  }

  /** POST /orgs/:tenantId/create-schema — provisions the tenant schema */
  @Post(':tenantId/create-schema')
  async createSchema(
    @Param('tenantId') tenantId: string,
    @Res() res: Response,
  ): Promise<void> {
    const result = await this.tenantService.createSchema(tenantId);

    if (result.isErr()) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: result.error.message });
      return;
    }

    res.status(HttpStatus.CREATED).json({ message: 'Schema created successfully' });
  }
}
