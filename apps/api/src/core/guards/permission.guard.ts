/**
 * Permission Guard
 * Checks if the current user has the required permissions
 */

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { REQUIRE_PERMISSION_KEY } from '../decorators/require-permission.decorator';
import { PermissionsService } from '../../permissions/permissions.service';

@Injectable()
export class PermissionGuard implements CanActivate {
  private readonly logger = new Logger(PermissionGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly permissionsService: PermissionsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      REQUIRE_PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    );

    // No permission requirement specified, allow access
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const tenantContext = request.tenantContext;

    // No tenant context available
    if (!tenantContext) {
      throw new ForbiddenException('Organization context required');
    }

    const { orgId, userId } = tenantContext;

    if (!orgId || !userId) {
      throw new ForbiddenException('Organization context required');
    }

    // Check if user has ANY of the required permissions
    for (const permission of requiredPermissions) {
      const hasPermission = await this.permissionsService.hasPermission(
        orgId,
        userId,
        permission,
      );
      if (hasPermission) {
        this.logger.debug(
          `User ${userId} has permission ${permission} in org ${orgId}`,
        );
        return true;
      }
    }

    this.logger.warn(
      `User ${userId} lacks required permissions: ${requiredPermissions.join(', ')} in org ${orgId}`,
    );

    throw new ForbiddenException(
      `This action requires one of the following permissions: ${requiredPermissions.join(', ')}`,
    );
  }
}

