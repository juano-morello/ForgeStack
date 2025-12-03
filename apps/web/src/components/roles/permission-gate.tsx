'use client';

/**
 * PermissionGate Component
 *
 * Conditionally renders children based on user permissions.
 * Used to show/hide UI elements based on RBAC permissions.
 */

import { usePermission } from '@/hooks/use-permission';

interface PermissionGateProps {
  permission: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Conditionally render children based on user permission
 * @param permission - Permission string in format "resource:action"
 * @param fallback - Optional fallback to render when user lacks permission
 * @param children - Content to render when user has permission
 */
export function PermissionGate({
  permission,
  fallback = null,
  children,
}: PermissionGateProps) {
  const hasPermission = usePermission(permission);

  if (!hasPermission) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

