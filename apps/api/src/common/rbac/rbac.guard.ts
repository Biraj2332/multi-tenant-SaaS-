import {
  Injectable, CanActivate, ExecutionContext,
  HttpException, HttpStatus, SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Permission, hasPermission } from './permissions';

export const PERMISSION_KEY = 'rbac:permission';
export const RequirePermission = (permission: Permission) => SetMetadata(PERMISSION_KEY, permission);

@Injectable()
export class RbacGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Permission | undefined>(
      PERMISSION_KEY, [ctx.getHandler(), ctx.getClass()],
    );
    if (!required) return true;

    const req = ctx.switchToHttp().getRequest();
    if (!hasPermission(req.membershipRole, required)) {
      throw new HttpException(
        { error: 'Forbidden', code: 'PERMISSION_DENIED', permission: required },
        HttpStatus.FORBIDDEN,
      );
    }
    return true;
  }
}
