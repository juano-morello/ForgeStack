/**
 * RequireRole Guard
 * Checks if the current user has the required role
 */

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { OrgRole } from '@forgestack/shared';
import { REQUIRE_ROLE_KEY } from '../decorators/require-role.decorator';

@Injectable()
export class RequireRoleGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<OrgRole[]>(REQUIRE_ROLE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // No role requirement specified, allow access
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const tenantContext = request.tenantContext;

    // No tenant context available
    if (!tenantContext) {
      throw new ForbiddenException('Organization context required');
    }

    // Check if user's role is in the required roles
    if (!requiredRoles.includes(tenantContext.role as OrgRole)) {
      throw new ForbiddenException(
        `This action requires one of the following roles: ${requiredRoles.join(', ')}`
      );
    }

    return true;
  }
}

