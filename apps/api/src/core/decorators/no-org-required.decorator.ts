/**
 * @NoOrgRequired() decorator
 * Marks routes that require authentication but not organization context.
 * The guard will verify the user is authenticated but skip org membership check.
 */

import { SetMetadata } from '@nestjs/common';

export const NO_ORG_REQUIRED_KEY = 'noOrgRequired';
export const NoOrgRequired = () => SetMetadata(NO_ORG_REQUIRED_KEY, true);

