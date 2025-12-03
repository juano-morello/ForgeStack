/**
 * RBAC Types
 *
 * Type definitions for Role-Based Access Control.
 */

export interface Permission {
  id: string;
  name: string;
  description: string | null;
  resource: string;
  action: string;
}

export interface Role {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  permissionCount?: number;
  memberCount?: number;
  createdAt: string;
  updatedAt: string;
  permissions?: Permission[];
}

export interface MemberRoles {
  userId: string;
  roles: Array<{
    id: string;
    name: string;
    isSystem: boolean;
    assignedAt: string;
  }>;
  effectivePermissions: string[];
}

export interface CreateRoleDto {
  name: string;
  description?: string;
  permissionIds: string[];
}

export interface UpdateRoleDto {
  name?: string;
  description?: string;
  permissionIds?: string[];
}

export interface AssignRolesDto {
  roleIds: string[];
}

export interface PermissionsResponse {
  permissions: Permission[];
  groupedByResource: Record<string, Permission[]>;
}

export interface RolesResponse {
  roles: Role[];
}

