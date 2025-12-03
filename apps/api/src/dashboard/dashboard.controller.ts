/**
 * Dashboard Controller
 * Handles HTTP requests for dashboard endpoints
 */

import { Controller, Get, Logger } from '@nestjs/common';
import { type TenantContext } from '@forgestack/db';
import { CurrentTenant } from '../core/decorators/tenant-context.decorator';
import { DashboardService } from './dashboard.service';
import { type DashboardSummaryDto } from './dto/dashboard-summary.dto';

@Controller('dashboard')
export class DashboardController {
  private readonly logger = new Logger(DashboardController.name);

  constructor(private readonly dashboardService: DashboardService) {}

  /**
   * GET /dashboard/summary
   * Get dashboard summary with stats, recent activity, and recent projects
   */
  @Get('summary')
  async getSummary(@CurrentTenant() ctx: TenantContext): Promise<DashboardSummaryDto> {
    this.logger.log(`Getting dashboard summary for org ${ctx.orgId}`);
    return this.dashboardService.getSummary(ctx);
  }
}

