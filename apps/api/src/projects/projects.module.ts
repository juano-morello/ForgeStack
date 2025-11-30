/**
 * Projects Module
 * Provides project management functionality
 */

import { Module } from '@nestjs/common';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { ProjectsRepository } from './projects.repository';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { ActivitiesModule } from '../activities/activities.module';

@Module({
  imports: [AuditLogsModule, ActivitiesModule],
  controllers: [ProjectsController],
  providers: [ProjectsRepository, ProjectsService],
  exports: [ProjectsService, ProjectsRepository],
})
export class ProjectsModule {}

