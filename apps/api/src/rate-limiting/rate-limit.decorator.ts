/**
 * Rate limit decorators
 */

import { SetMetadata } from '@nestjs/common';

export const RATE_LIMIT_KEY = 'rate_limit';

export interface RateLimitOptions {
  points?: number; // Custom limit
  duration?: number; // In seconds
  keyType?: 'org' | 'ip' | 'api_key';
  skipIf?: (req: unknown) => boolean;
  skip?: boolean;
}

export const RateLimit = (options: RateLimitOptions = {}) =>
  SetMetadata(RATE_LIMIT_KEY, options);

export const SkipRateLimit = () => SetMetadata(RATE_LIMIT_KEY, { skip: true });

