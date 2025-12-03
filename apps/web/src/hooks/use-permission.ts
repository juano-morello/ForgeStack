'use client';

/**
 * usePermission Hook
 *
 * Hook to check if current user has specific permissions.
 */

import { useOrgContext } from '@/components/providers/org-provider';

/**
 * Hook to check if current user has a specific permission
 * @param permission - Permission string in format "resource:action" (e.g., "projects:create")
 * @returns boolean - true if user has the permission
 */
export function usePermission(permission: string): boolean {
  const { currentOrg } = useOrgContext();

  if (!currentOrg?.effectivePermissions) {
    return false;
  }

  const permissions = currentOrg.effectivePermissions;

  // Check for wildcard (Owner has all permissions)
  if (permissions.includes('*')) return true;

  // Check exact match
  if (permissions.includes(permission)) return true;

  // Check resource wildcard (e.g., "projects:*")
  const [resource] = permission.split(':');
  if (permissions.includes(`${resource}:*`)) return true;

  return false;
}

/**
 * Hook to check if user has ANY of the specified permissions
 * @param permissions - Array of permission strings
 * @returns boolean - true if user has at least one of the permissions
 */
export function usePermissions(permissions: string[]): boolean {
  const { currentOrg } = useOrgContext();

  if (!currentOrg?.effectivePermissions) {
    return false;
  }

  return permissions.some((p) => {
    const userPerms = currentOrg.effectivePermissions;
    if (!userPerms) return false;

    // Check for wildcard
    if (userPerms.includes('*')) return true;

    // Check exact match
    if (userPerms.includes(p)) return true;

    // Check resource wildcard
    const [resource] = p.split(':');
    return userPerms.includes(`${resource}:*`);
  });
}

