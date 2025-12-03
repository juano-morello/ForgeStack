/**
 * Dashboard Module
 * Provides dashboard functionality
 */

import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { ProjectsModule } from '../projects/projects.module';
import { MembersModule } from '../members/members.module';
import { ApiKeysModule } from '../api-keys/api-keys.module';
import { ActivitiesModule } from '../activities/activities.module';
import { FilesModule } from '../files/files.module';
import { BillingModule } from '../billing/billing.module';
import { UsageModule } from '../usage/usage.module';

@Module({
  imports: [
    ProjectsModule,
    MembersModule,
    ApiKeysModule,
    ActivitiesModule,
    FilesModule,
    BillingModule,
    UsageModule,
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}

