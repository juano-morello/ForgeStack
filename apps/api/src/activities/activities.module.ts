/**
 * Activities Module
 * Provides activity feed functionality
 */

import { Module } from '@nestjs/common';
import { ActivitiesController } from './activities.controller';
import { ActivitiesService } from './activities.service';
import { ActivitiesRepository } from './activities.repository';

@Module({
  controllers: [ActivitiesController],
  providers: [ActivitiesRepository, ActivitiesService],
  exports: [ActivitiesService, ActivitiesRepository],
})
export class ActivitiesModule {}

