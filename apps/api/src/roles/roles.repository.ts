/**
 * Roles Repository
 * Handles all database operations for roles
 */

import { Injectable, Logger } from '@nestjs/common';
import {
  eq,
  and,
  or,
  isNull,
  sql,
  count,
  withServiceContext,
  roles,
  permissions,
  rolePermissions,
  memberRoles,
  type Role,
  type Permission,
  type NewRole,
} from '@forgestack/db';

export interface RoleWithPermissions extends Role {
  permissions: Permission[];
}

export interface RoleWithCounts extends Role {
  permissionCount: number;
  memberCount: number;
}

@Injectable()
export class RolesRepository {
  private readonly logger = new Logger(RolesRepository.name);

  /**
   * Find all roles for an organization (custom + system roles)
   */
  async findAllForOrg(orgId: string): Promise<RoleWithCounts[]> {
    this.logger.debug(`Finding all roles for org ${orgId}`);

    return withServiceContext('RolesRepository.findAllForOrg', async (db) => {
      // Get roles (org-specific + system roles)
      const rolesResult = await db
        .select()
        .from(roles)
        .where(or(eq(roles.orgId, orgId), isNull(roles.orgId)))
        .orderBy(roles.isSystem, roles.name);

      // Get permission counts for each role
      const roleIds = rolesResult.map((r) => r.id);
      const permissionCounts = await db
        .select({
          roleId: rolePermissions.roleId,
          count: count(),
        })
        .from(rolePermissions)
        .where(sql`${rolePermissions.roleId} = ANY(${roleIds})`)
        .groupBy(rolePermissions.roleId);

      // Get member counts for each role
      const memberCounts = await db
        .select({
          roleId: memberRoles.roleId,
          count: count(),
        })
        .from(memberRoles)
        .where(and(eq(memberRoles.orgId, orgId), sql`${memberRoles.roleId} = ANY(${roleIds})`))
        .groupBy(memberRoles.roleId);

      // Combine results
      return rolesResult.map((role) => ({
        ...role,
        permissionCount:
          permissionCounts.find((pc) => pc.roleId === role.id)?.count || 0,
        memberCount: memberCounts.find((mc) => mc.roleId === role.id)?.count || 0,
      }));
    });
  }

  /**
   * Find a single role by ID with permissions
   */
  async findOne(roleId: string): Promise<RoleWithPermissions | null> {
    this.logger.debug(`Finding role ${roleId}`);

    return withServiceContext('RolesRepository.findOne', async (db) => {
      const [role] = await db.select().from(roles).where(eq(roles.id, roleId));

      if (!role) {
        return null;
      }

      // Get permissions for this role
      const perms = await db
        .select({
          id: permissions.id,
          name: permissions.name,
          description: permissions.description,
          resource: permissions.resource,
          action: permissions.action,
        })
        .from(rolePermissions)
        .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
        .where(eq(rolePermissions.roleId, roleId));

      return {
        ...role,
        permissions: perms,
      };
    });
  }

  /**
   * Find a system role by name
   */
  async findSystemRole(name: string): Promise<Role | null> {
    this.logger.debug(`Finding system role: ${name}`);

    return withServiceContext('RolesRepository.findSystemRole', async (db) => {
      const [role] = await db
        .select()
        .from(roles)
        .where(and(eq(roles.name, name), eq(roles.isSystem, true)));

      return role || null;
    });
  }

  /**
   * Create a custom role with permissions
   */
  async create(
    data: Omit<NewRole, 'isSystem'>,
    permissionIds: string[],
  ): Promise<RoleWithPermissions> {
    this.logger.debug(`Creating role: ${data.name}`);

    return withServiceContext('RolesRepository.create', async (db) => {
      // Create role
      const [role] = await db
        .insert(roles)
        .values({
          ...data,
          isSystem: false,
        })
        .returning();

      // Assign permissions
      if (permissionIds.length > 0) {
        await db.insert(rolePermissions).values(
          permissionIds.map((permissionId) => ({
            roleId: role.id,
            permissionId,
          })),
        );
      }

      // Fetch permissions
      const perms = await db
        .select({
          id: permissions.id,
          name: permissions.name,
          description: permissions.description,
          resource: permissions.resource,
          action: permissions.action,
        })
        .from(rolePermissions)
        .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
        .where(eq(rolePermissions.roleId, role.id));

      return {
        ...role,
        permissions: perms,
      };
    });
  }

  /**
   * Update a role
   */
  async update(
    roleId: string,
    data: Partial<Omit<NewRole, 'isSystem' | 'orgId'>>,
    permissionIds?: string[],
  ): Promise<RoleWithPermissions> {
    this.logger.debug(`Updating role ${roleId}`);

    return withServiceContext('RolesRepository.update', async (db) => {
      // Update role
      const [role] = await db
        .update(roles)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(eq(roles.id, roleId))
        .returning();

      // Update permissions if provided
      if (permissionIds !== undefined) {
        // Delete existing permissions
        await db.delete(rolePermissions).where(eq(rolePermissions.roleId, roleId));

        // Insert new permissions
        if (permissionIds.length > 0) {
          await db.insert(rolePermissions).values(
            permissionIds.map((permissionId) => ({
              roleId,
              permissionId,
            })),
          );
        }
      }

      // Fetch permissions
      const perms = await db
        .select({
          id: permissions.id,
          name: permissions.name,
          description: permissions.description,
          resource: permissions.resource,
          action: permissions.action,
        })
        .from(rolePermissions)
        .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
        .where(eq(rolePermissions.roleId, roleId));

      return {
        ...role,
        permissions: perms,
      };
    });
  }

  /**
   * Delete a role
   */
  async delete(roleId: string): Promise<void> {
    this.logger.debug(`Deleting role ${roleId}`);

    return withServiceContext('RolesRepository.delete', async (db) => {
      await db.delete(roles).where(eq(roles.id, roleId));
    });
  }

  /**
   * Get member count for a role
   */
  async getMemberCount(roleId: string): Promise<number> {
    this.logger.debug(`Getting member count for role ${roleId}`);

    return withServiceContext('RolesRepository.getMemberCount', async (db) => {
      const [result] = await db
        .select({ count: count() })
        .from(memberRoles)
        .where(eq(memberRoles.roleId, roleId));

      return result?.count || 0;
    });
  }

  /**
   * Get member's roles in an organization
   */
  async getMemberRoles(orgId: string, userId: string): Promise<Role[]> {
    this.logger.debug(`Getting roles for user ${userId} in org ${orgId}`);

    return withServiceContext('RolesRepository.getMemberRoles', async (db) => {
      const result = await db
        .select({
          id: roles.id,
          orgId: roles.orgId,
          name: roles.name,
          description: roles.description,
          isSystem: roles.isSystem,
          createdAt: roles.createdAt,
          updatedAt: roles.updatedAt,
        })
        .from(memberRoles)
        .innerJoin(roles, eq(memberRoles.roleId, roles.id))
        .where(and(eq(memberRoles.orgId, orgId), eq(memberRoles.userId, userId)));

      return result;
    });
  }

  /**
   * Assign roles to a member (replaces existing roles)
   */
  async assignRolesToMember(
    orgId: string,
    userId: string,
    roleIds: string[],
  ): Promise<void> {
    this.logger.debug(`Assigning roles to user ${userId} in org ${orgId}`);

    return withServiceContext('RolesRepository.assignRolesToMember', async (db) => {
      // Delete existing role assignments
      await db
        .delete(memberRoles)
        .where(and(eq(memberRoles.orgId, orgId), eq(memberRoles.userId, userId)));

      // Insert new role assignments
      if (roleIds.length > 0) {
        await db.insert(memberRoles).values(
          roleIds.map((roleId) => ({
            orgId,
            userId,
            roleId,
          })),
        );
      }
    });
  }
}

