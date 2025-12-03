/**
 * @RequireSuperAdmin() decorator
 * Marks routes as requiring super-admin access
 * Used in conjunction with SuperAdminGuard
 */

import { SetMetadata } from '@nestjs/common';

export const REQUIRE_SUPER_ADMIN_KEY = 'require_super_admin';

/**
 * Decorator to require super-admin access for an endpoint
 * Super-admins bypass organization context requirements
 * @example @RequireSuperAdmin()
 */
export const RequireSuperAdmin = () => SetMetadata(REQUIRE_SUPER_ADMIN_KEY, true);

