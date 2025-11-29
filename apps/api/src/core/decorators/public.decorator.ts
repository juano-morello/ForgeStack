/**
 * @Public() decorator
 * Marks routes as public, bypassing the TenantContextGuard
 */

import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

