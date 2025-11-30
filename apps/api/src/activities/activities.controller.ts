/**
 * Activities Controller
 * Handles HTTP requests for activity operations
 */

import { Controller, Get, Query, Logger } from '@nestjs/common';
import { type TenantContext } from '@forgestack/db';
import { CurrentTenant } from '../core/decorators/tenant-context.decorator';
import { ActivitiesService } from './activities.service';
import { ActivityQueryDto, RecentActivitiesQueryDto } from './dto';

@Controller('activities')
export class ActivitiesController {
  private readonly logger = new Logger(ActivitiesController.name);

  constructor(private readonly activitiesService: ActivitiesService) {}

  /**
   * List activities with pagination and filters
   * GET /activities
   * 
   * All org members can access this endpoint
   */
  @Get()
  async findAll(
    @CurrentTenant() ctx: TenantContext,
    @Query() query: ActivityQueryDto,
  ) {
    this.logger.debug(`GET /activities for org ${ctx.orgId}`);

    return this.activitiesService.findAll(ctx, {
      type: query.type,
      actorId: query.actorId,
      resourceType: query.resourceType,
      since: query.since,
      limit: query.limit,
      cursor: query.cursor,
    });
  }

  /**
   * Get recent activities (dashboard widget)
   * GET /activities/recent
   * 
   * All org members can access this endpoint
   */
  @Get('recent')
  async findRecent(
    @CurrentTenant() ctx: TenantContext,
    @Query() query: RecentActivitiesQueryDto,
  ) {
    this.logger.debug(`GET /activities/recent for org ${ctx.orgId}`);

    const activities = await this.activitiesService.findRecent(
      ctx,
      query.limit || 10,
    );

    return { data: activities };
  }
}

