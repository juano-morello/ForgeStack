/**
 * Dashboard Service
 * Handles business logic for dashboard operations
 */

import { Injectable, Logger } from '@nestjs/common';
import { type TenantContext } from '@forgestack/db';
import { ProjectsRepository } from '../projects/projects.repository';
import { MembersRepository } from '../members/members.repository';
import { ApiKeysRepository } from '../api-keys/api-keys.repository';
import { ActivitiesRepository } from '../activities/activities.repository';
import { FilesRepository } from '../files/files.repository';
import { BillingService } from '../billing/billing.service';
import { UsageService } from '../usage/usage.service';
import { type DashboardSummaryDto } from './dto/dashboard-summary.dto';

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(
    private readonly projectsRepository: ProjectsRepository,
    private readonly membersRepository: MembersRepository,
    private readonly apiKeysRepository: ApiKeysRepository,
    private readonly activitiesRepository: ActivitiesRepository,
    private readonly filesRepository: FilesRepository,
    private readonly billingService: BillingService,
    private readonly usageService: UsageService,
  ) {}

  /**
   * Get dashboard summary with all stats and recent data
   */
  async getSummary(ctx: TenantContext): Promise<DashboardSummaryDto> {
    this.logger.debug(`Getting dashboard summary for org ${ctx.orgId}`);

    // Fetch all data in parallel for performance
    const [
      projectsCount,
      membersCount,
      apiKeysCount,
      recentActivities,
      recentProjects,
      storageUsed,
    ] = await Promise.all([
      this.projectsRepository.count(ctx),
      this.membersRepository.count(ctx.orgId),
      this.apiKeysRepository.count(ctx),
      this.activitiesRepository.findRecent(ctx, 5),
      this.projectsRepository.findRecent(ctx, 5),
      this.filesRepository.getStorageUsed(ctx.orgId),
    ]);

    const summary: DashboardSummaryDto = {
      stats: {
        projects: projectsCount,
        members: membersCount,
        apiKeys: apiKeysCount,
        storageUsedBytes: storageUsed,
      },
      recentActivity: recentActivities,
      recentProjects: recentProjects,
    };

    // Only include org health for OWNER role
    if (ctx.role === 'OWNER') {
      try {
        const [subscription, usage] = await Promise.all([
          this.billingService.getSubscription(ctx),
          this.usageService.getCurrentUsage(ctx),
        ]);

        summary.orgHealth = {
          subscriptionStatus: subscription.status,
          usageSummary: {
            apiCalls: usage.usage.apiCalls,
            storage: usage.usage.storage,
            seats: usage.usage.seats,
          },
        };
      } catch (error) {
        this.logger.warn(`Failed to fetch org health: ${error instanceof Error ? error.message : 'Unknown error'}`);
        // Don't fail the entire request if org health fails
        summary.orgHealth = null;
      }
    }

    return summary;
  }
}

