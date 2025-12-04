/**
 * Activities Controller
 * Handles HTTP requests for activity operations
 */

import { Controller, Get, Query, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { type TenantContext } from '@forgestack/db';
import { CurrentTenant } from '../core/decorators/tenant-context.decorator';
import { ActivitiesService } from './activities.service';
import { ActivityQueryDto, RecentActivitiesQueryDto } from './dto';

@ApiTags('Activities')
@ApiBearerAuth()
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
  @ApiOperation({
    summary: 'List activities',
    description: 'Get a paginated list of activities with optional filters (all org members can access)'
  })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of items to return (1-50)', example: 20 })
  @ApiQuery({ name: 'cursor', required: false, type: String, description: 'Pagination cursor' })
  @ApiQuery({ name: 'type', required: false, type: String, description: 'Filter by activity type' })
  @ApiQuery({ name: 'actorId', required: false, type: String, description: 'Filter by actor user ID' })
  @ApiQuery({ name: 'resourceType', required: false, type: String, description: 'Filter by resource type' })
  @ApiQuery({ name: 'since', required: false, type: String, description: 'Filter activities since this ISO 8601 timestamp' })
  @ApiResponse({ status: 200, description: 'Activities retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
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
  @ApiOperation({
    summary: 'Get recent activities',
    description: 'Get recent activities for dashboard widget (all org members can access)'
  })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of items to return (1-20)', example: 10 })
  @ApiResponse({ status: 200, description: 'Recent activities retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
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

