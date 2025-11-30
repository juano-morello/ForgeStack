/**
 * Rate limiting module
 * Provides rate limiting functionality across the application
 */

import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { RateLimitingService } from './rate-limiting.service';
import { RateLimitGuard } from './rate-limiting.guard';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    RateLimitingService,
    {
      provide: APP_GUARD,
      useClass: RateLimitGuard,
    },
  ],
  exports: [RateLimitingService],
})
export class RateLimitingModule {}

