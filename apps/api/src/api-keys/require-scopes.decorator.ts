/**
 * @RequireScopes() decorator
 * Marks routes that require specific API key scopes
 */

import { SetMetadata } from '@nestjs/common';

export const RequireScopes = (...scopes: string[]) => SetMetadata('scopes', scopes);

