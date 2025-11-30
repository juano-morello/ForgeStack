/**
 * Feature Flags Module
 * Provides feature flag management functionality
 */

import { Module } from '@nestjs/common';
import { FeatureFlagsController } from './feature-flags.controller';
import { FeatureFlagsAdminController } from './feature-flags-admin.controller';
import { FeatureFlagsService } from './feature-flags.service';
import { FeatureFlagsRepository } from './feature-flags.repository';

@Module({
  controllers: [FeatureFlagsController, FeatureFlagsAdminController],
  providers: [FeatureFlagsRepository, FeatureFlagsService],
  exports: [FeatureFlagsService, FeatureFlagsRepository],
})
export class FeatureFlagsModule {}

