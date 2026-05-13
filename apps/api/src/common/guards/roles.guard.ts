import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SetMetadata } from '@nestjs/common';
import { Role } from '../../modules/memberships/enums/role.enum';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);

/** Role hierarchy: OWNER > ADMIN > MEMBER > VIEWER */
const ROLE_LEVEL: Record<string, number> = {
  [Role.OWNER]: 40,
  [Role.ADMIN]: 30,
  [Role.MEMBER]: 20,
  [Role.VIEWER]: 10,
};

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) return true;

    const request = context.switchToHttp().getRequest();
    const userRole: string | undefined = request.membershipRole;

    if (!userRole) {
      throw new HttpException('Forbidden: no role resolved', HttpStatus.FORBIDDEN);
    }

    const userLevel = ROLE_LEVEL[userRole] ?? 0;
    const minRequired = Math.min(...requiredRoles.map((r) => ROLE_LEVEL[r] ?? 0));

    if (userLevel < minRequired) {
      throw new HttpException('Forbidden: insufficient role', HttpStatus.FORBIDDEN);
    }

    return true;
  }
}
