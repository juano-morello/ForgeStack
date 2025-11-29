/**
 * Projects Module
 * Provides project management functionality
 */

import { Module } from '@nestjs/common';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { ProjectsRepository } from './projects.repository';

@Module({
  controllers: [ProjectsController],
  providers: [ProjectsRepository, ProjectsService],
  exports: [ProjectsService, ProjectsRepository],
})
export class ProjectsModule {}

