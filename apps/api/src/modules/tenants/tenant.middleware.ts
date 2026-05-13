import { Injectable, NestMiddleware, HttpStatus } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { TenantService } from './tenant.service';

/** Augment Express Request with resolved tenant info */
declare global {
  namespace Express {
    interface Request {
      tenantId?: string;
      tenantSchemaName?: string;
      tenantPlan?: string;
    }
  }
}

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private readonly tenantService: TenantService) {}

  async use(req: Request, res: Response, next: NextFunction): Promise<void> {
    const orgId = req.headers['x-org-id'] as string | undefined;

    if (!orgId) {
      res.status(HttpStatus.BAD_REQUEST).json({ error: 'Missing x-org-id header' });
      return;
    }

    const resolveResult = await this.tenantService.resolve(orgId);

    if (resolveResult.isErr()) {
      const status =
        resolveResult.error._tag === 'NotFoundError'
          ? HttpStatus.NOT_FOUND
          : HttpStatus.INTERNAL_SERVER_ERROR;
      res.status(status).json({ error: resolveResult.error.message });
      return;
    }

    const tenant = resolveResult.value;
    req.tenantId = tenant.tenantId;
    req.tenantSchemaName = tenant.schemaName;
    req.tenantPlan = tenant.plan;

    next();
  }
}
