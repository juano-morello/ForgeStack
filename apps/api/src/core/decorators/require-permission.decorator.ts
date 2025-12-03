/**
 * RequirePermission Decorator
 * Declaratively require specific permissions for controller methods
 */

import { SetMetadata } from '@nestjs/common';

export const REQUIRE_PERMISSION_KEY = 'require_permission';

/**
 * Decorator to require specific permissions
 * @param permissions - One or more permissions required (user needs at least one)
 * @example @RequirePermission('projects:create')
 * @example @RequirePermission('projects:create', 'projects:update')
 */
export const RequirePermission = (...permissions: string[]) =>
  SetMetadata(REQUIRE_PERMISSION_KEY, permissions);

