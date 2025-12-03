/**
 * Permissions Repository
 * Handles all database operations for permissions
 */

import { Injectable, Logger } from '@nestjs/common';
import {
  eq,
  and,
  inArray,
  withServiceContext,
  permissions,
  roles,
  rolePermissions,
  memberRoles,
  type Permission,
} from '@forgestack/db';

@Injectable()
export class PermissionsRepository {
  private readonly logger = new Logger(PermissionsRepository.name);

  /**
   * Find all permissions
   */
  async findAll(): Promise<Permission[]> {
    this.logger.debug('Finding all permissions');

    return withServiceContext('PermissionsRepository.findAll', async (db) => {
      return db.select().from(permissions).orderBy(permissions.resource, permissions.action);
    });
  }

  /**
   * Find permissions by names
   */
  async findByNames(names: string[]): Promise<Permission[]> {
    this.logger.debug(`Finding permissions by names: ${names.join(', ')}`);

    if (names.length === 0) {
      return [];
    }

    return withServiceContext('PermissionsRepository.findByNames', async (db) => {
      return db.select().from(permissions).where(inArray(permissions.name, names));
    });
  }

  /**
   * Get all effective permissions for a user in an organization
   * Aggregates permissions from all assigned roles
   */
  async getEffectivePermissions(orgId: string, userId: string): Promise<string[]> {
    this.logger.debug(`Getting effective permissions for user ${userId} in org ${orgId}`);

    return withServiceContext('PermissionsRepository.getEffectivePermissions', async (db) => {
      // Query: member_roles → roles → role_permissions → permissions
      const result = await db
        .select({
          permissionName: permissions.name,
        })
        .from(memberRoles)
        .innerJoin(roles, eq(memberRoles.roleId, roles.id))
        .innerJoin(rolePermissions, eq(roles.id, rolePermissions.roleId))
        .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
        .where(and(eq(memberRoles.orgId, orgId), eq(memberRoles.userId, userId)));

      // Extract unique permission names
      const permissionNames = [...new Set(result.map((r) => r.permissionName))];

      // Check if user has a role with wildcard permission (Owner role)
      const wildcardResult = await db
        .select({
          permissionName: permissions.name,
        })
        .from(memberRoles)
        .innerJoin(roles, eq(memberRoles.roleId, roles.id))
        .innerJoin(rolePermissions, eq(roles.id, rolePermissions.roleId))
        .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
        .where(
          and(
            eq(memberRoles.orgId, orgId),
            eq(memberRoles.userId, userId),
            eq(permissions.name, '*'),
          ),
        );

      if (wildcardResult.length > 0) {
        return ['*'];
      }

      return permissionNames;
    });
  }
}

