/**
 * Usage Module
 * Handles usage tracking and billing
 */

import { Module } from '@nestjs/common';
import { UsageController } from './usage.controller';
import { UsageService } from './usage.service';
import { UsageRepository } from './usage.repository';
import { UsageTrackingService } from './usage-tracking.service';
import { UsageTrackingInterceptor } from './usage-tracking.interceptor';

@Module({
  controllers: [UsageController],
  providers: [
    UsageService,
    UsageRepository,
    UsageTrackingService,
    UsageTrackingInterceptor,
  ],
  exports: [
    UsageService,
    UsageRepository,
    UsageTrackingService,
    UsageTrackingInterceptor,
  ],
})
export class UsageModule {}

