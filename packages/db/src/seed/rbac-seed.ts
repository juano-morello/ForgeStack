/* eslint-disable no-console */
/**
 * RBAC Seed - System roles and permissions
 *
 * Seeds all permissions and system roles (Owner, Admin, Member, Viewer)
 */

import { inArray } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../schema/index.js';
import { permissions, roles, rolePermissions } from '../schema';

/**
 * All available permissions in the system
 */
const PERMISSIONS = [
  // Projects
  { name: 'projects:create', resource: 'projects', action: 'create', description: 'Create new projects' },
  { name: 'projects:read', resource: 'projects', action: 'read', description: 'View projects' },
  { name: 'projects:update', resource: 'projects', action: 'update', description: 'Edit projects' },
  { name: 'projects:delete', resource: 'projects', action: 'delete', description: 'Delete projects' },

  // Members
  { name: 'members:invite', resource: 'members', action: 'invite', description: 'Invite new members' },
  { name: 'members:read', resource: 'members', action: 'read', description: 'View member list' },
  { name: 'members:update', resource: 'members', action: 'update', description: 'Update member roles' },
  { name: 'members:remove', resource: 'members', action: 'remove', description: 'Remove members from org' },

  // Billing
  { name: 'billing:read', resource: 'billing', action: 'read', description: 'View billing information' },
  { name: 'billing:manage', resource: 'billing', action: 'manage', description: 'Manage billing and subscriptions' },

  // Settings
  { name: 'settings:read', resource: 'settings', action: 'read', description: 'View organization settings' },
  { name: 'settings:update', resource: 'settings', action: 'update', description: 'Update organization settings' },

  // API Keys
  { name: 'api_keys:create', resource: 'api_keys', action: 'create', description: 'Create API keys' },
  { name: 'api_keys:read', resource: 'api_keys', action: 'read', description: 'View API keys' },
  { name: 'api_keys:revoke', resource: 'api_keys', action: 'revoke', description: 'Revoke API keys' },

  // Webhooks
  { name: 'webhooks:create', resource: 'webhooks', action: 'create', description: 'Create webhooks' },
  { name: 'webhooks:read', resource: 'webhooks', action: 'read', description: 'View webhooks' },
  { name: 'webhooks:update', resource: 'webhooks', action: 'update', description: 'Update webhooks' },
  { name: 'webhooks:delete', resource: 'webhooks', action: 'delete', description: 'Delete webhooks' },

  // Audit Logs
  { name: 'audit_logs:read', resource: 'audit_logs', action: 'read', description: 'View audit logs' },

  // Roles
  { name: 'roles:create', resource: 'roles', action: 'create', description: 'Create custom roles' },
  { name: 'roles:read', resource: 'roles', action: 'read', description: 'View roles' },
  { name: 'roles:update', resource: 'roles', action: 'update', description: 'Update custom roles' },
  { name: 'roles:delete', resource: 'roles', action: 'delete', description: 'Delete custom roles' },

  // Files
  { name: 'files:upload', resource: 'files', action: 'upload', description: 'Upload files' },
  { name: 'files:read', resource: 'files', action: 'read', description: 'View and download files' },
  { name: 'files:delete', resource: 'files', action: 'delete', description: 'Delete files' },

  // Notifications
  { name: 'notifications:read', resource: 'notifications', action: 'read', description: 'View notifications' },
  { name: 'notifications:manage', resource: 'notifications', action: 'manage', description: 'Manage notification settings' },

  // Feature Flags
  { name: 'feature_flags:read', resource: 'feature_flags', action: 'read', description: 'View feature flags' },
  { name: 'feature_flags:manage', resource: 'feature_flags', action: 'manage', description: 'Manage feature flags' },

  // Wildcard permission for Owner role
  { name: '*', resource: '*', action: '*', description: 'All permissions (Owner only)' },
];

/**
 * System roles with their permission mappings
 */
const SYSTEM_ROLES = [
  {
    name: 'Owner',
    description: 'Full access to all resources. Cannot be modified or deleted.',
    permissions: ['*'], // Wildcard - all permissions
  },
  {
    name: 'Admin',
    description: 'Administrative access. Cannot manage roles or billing.',
    permissions: PERMISSIONS
      .filter(p => !p.name.startsWith('roles:') && p.name !== 'billing:manage' && p.name !== '*')
      .map(p => p.name),
  },
  {
    name: 'Member',
    description: 'Standard team member with create and edit access.',
    permissions: [
      'projects:create', 'projects:read', 'projects:update',
      'members:read',
      'settings:read',
      'api_keys:create', 'api_keys:read',
      'webhooks:create', 'webhooks:read', 'webhooks:update',
      'files:upload', 'files:read',
      'notifications:read',
      'feature_flags:read',
    ],
  },
  {
    name: 'Viewer',
    description: 'Read-only access to all resources.',
    permissions: PERMISSIONS.filter(p => p.action === 'read').map(p => p.name),
  },
];

/**
 * Seed RBAC permissions and system roles
 */
export async function seedRbac(db: NodePgDatabase<typeof schema>) {
  console.log('Seeding RBAC permissions and roles...');

  // Insert all permissions
  for (const perm of PERMISSIONS) {
    await db
      .insert(permissions)
      .values(perm)
      .onConflictDoNothing();
  }
  console.log(`Seeded ${PERMISSIONS.length} permissions`);

  // Insert system roles and assign permissions
  for (const roleData of SYSTEM_ROLES) {
    // Insert role
    const [insertedRole] = await db
      .insert(roles)
      .values({
        orgId: null, // System roles have null orgId
        name: roleData.name,
        description: roleData.description,
        isSystem: true,
      })
      .onConflictDoNothing()
      .returning();

    if (insertedRole) {
      // Get permission IDs for this role
      const permIds = await db
        .select({ id: permissions.id })
        .from(permissions)
        .where(inArray(permissions.name, roleData.permissions));

      // Insert role-permission mappings
      if (permIds.length > 0) {
        await db.insert(rolePermissions).values(
          permIds.map(p => ({ roleId: insertedRole.id, permissionId: p.id }))
        ).onConflictDoNothing();
      }

      console.log(`Seeded system role: ${roleData.name} with ${permIds.length} permissions`);
    }
  }

  console.log('RBAC seeding complete!');
}

