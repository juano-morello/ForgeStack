/**
 * Permissions Service
 * Handles business logic for permission operations
 */

import { Injectable, Logger } from '@nestjs/common';
import { PermissionsRepository } from './permissions.repository';
import type { Permission } from '@forgestack/db';

export interface PermissionsByResource {
  [resource: string]: Permission[];
}

@Injectable()
export class PermissionsService {
  private readonly logger = new Logger(PermissionsService.name);

  constructor(private readonly permissionsRepository: PermissionsRepository) {}

  /**
   * Check if user has a specific permission in the current org
   * Aggregates permissions from all assigned roles
   */
  async hasPermission(orgId: string, userId: string, permission: string): Promise<boolean> {
    this.logger.debug(`Checking if user ${userId} has permission ${permission} in org ${orgId}`);

    const effectivePermissions = await this.getEffectivePermissions(orgId, userId);

    // Check for wildcard (Owner has all permissions)
    if (effectivePermissions.includes('*')) {
      this.logger.debug(`User ${userId} has wildcard permission`);
      return true;
    }

    // Check for exact match
    if (effectivePermissions.includes(permission)) {
      this.logger.debug(`User ${userId} has exact permission ${permission}`);
      return true;
    }

    // Check for resource wildcard (e.g., "projects:*")
    const [resource] = permission.split(':');
    const resourceWildcard = `${resource}:*`;
    if (effectivePermissions.includes(resourceWildcard)) {
      this.logger.debug(`User ${userId} has resource wildcard ${resourceWildcard}`);
      return true;
    }

    this.logger.debug(`User ${userId} does not have permission ${permission}`);
    return false;
  }

  /**
   * Get all effective permissions for a user in an org
   * Results cached per-request
   */
  async getEffectivePermissions(orgId: string, userId: string): Promise<string[]> {
    return this.permissionsRepository.getEffectivePermissions(orgId, userId);
  }

  /**
   * List all available permissions
   */
  async listAll(): Promise<Permission[]> {
    return this.permissionsRepository.findAll();
  }

  /**
   * List all permissions grouped by resource
   */
  async listAllGrouped(): Promise<{
    permissions: Permission[];
    groupedByResource: PermissionsByResource;
  }> {
    const allPermissions = await this.listAll();

    const groupedByResource: PermissionsByResource = {};
    for (const permission of allPermissions) {
      if (!groupedByResource[permission.resource]) {
        groupedByResource[permission.resource] = [];
      }
      groupedByResource[permission.resource].push(permission);
    }

    return {
      permissions: allPermissions,
      groupedByResource,
    };
  }
}

