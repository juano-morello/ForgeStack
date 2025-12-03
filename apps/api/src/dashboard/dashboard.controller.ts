/**
 * Dashboard Controller
 * Handles HTTP requests for dashboard endpoints
 */

import { Controller, Get, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { type TenantContext } from '@forgestack/db';
import { CurrentTenant } from '../core/decorators/tenant-context.decorator';
import { DashboardService } from './dashboard.service';
import { type DashboardSummaryDto } from './dto/dashboard-summary.dto';

@ApiTags('Dashboard')
@ApiBearerAuth()
@Controller('dashboard')
export class DashboardController {
  private readonly logger = new Logger(DashboardController.name);

  constructor(private readonly dashboardService: DashboardService) {}

  /**
   * GET /dashboard/summary
   * Get dashboard summary with stats, recent activity, and recent projects
   */
  @Get('summary')
  @ApiOperation({ summary: 'Get dashboard summary', description: 'Get dashboard summary with stats, recent activity, and recent projects' })
  @ApiResponse({ status: 200, description: 'Dashboard summary' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getSummary(@CurrentTenant() ctx: TenantContext): Promise<DashboardSummaryDto> {
    this.logger.log(`Getting dashboard summary for org ${ctx.orgId}`);
    return this.dashboardService.getSummary(ctx);
  }
}

