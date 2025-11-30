/**
 * RequireRole Decorator
 * Declaratively require specific roles for controller methods
 */

import { SetMetadata } from '@nestjs/common';

export const REQUIRE_ROLE_KEY = 'require_role';

export type OrgRole = 'OWNER' | 'MEMBER';

/**
 * Decorator to require specific organization roles
 * @param roles - One or more roles that are allowed to access the endpoint
 * @example @RequireRole('OWNER')
 * @example @RequireRole('OWNER', 'MEMBER')
 */
export const RequireRole = (...roles: OrgRole[]) => SetMetadata(REQUIRE_ROLE_KEY, roles);

