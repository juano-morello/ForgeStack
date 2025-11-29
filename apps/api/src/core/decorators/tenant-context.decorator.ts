/**
 * @CurrentTenant() parameter decorator
 * Extracts the tenant context from the request
 */

import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { TenantContext } from '@forgestack/db';

export const CurrentTenant = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): TenantContext => {
    const request = ctx.switchToHttp().getRequest();
    return request.tenantContext;
  },
);

