/**
 * Activities Service
 * Handles business logic for activity operations
 */

import { Injectable, Logger } from '@nestjs/common';
import { type TenantContext, type Activity } from '@forgestack/db';
import { ActivitiesRepository, type FindAllOptions } from './activities.repository';
import { QueueService } from '../queue/queue.service';
import { ActivityDto, PaginatedActivitiesDto } from './dto';

/**
 * Activity types and their configurations
 */
export const ACTIVITY_TYPES = {
  // Projects
  'project.created': { title: 'created a new project', aggregatable: false },
  'project.updated': { title: 'updated project', aggregatable: false },
  'project.deleted': { title: 'deleted project', aggregatable: false },
  
  // Members
  'member.joined': { title: 'joined the organization', aggregatable: false },
  'member.invited': { title: 'invited a new member', aggregatable: true },
  'member.left': { title: 'left the organization', aggregatable: false },
  
  // Files
  'file.uploaded': { title: 'uploaded a file', aggregatable: true },
  'file.deleted': { title: 'deleted a file', aggregatable: true },
  
  // API Keys
  'api_key.created': { title: 'created an API key', aggregatable: false },
  
  // Webhooks
  'webhook.created': { title: 'created a webhook', aggregatable: false },
} as const;

/**
 * Event data for creating an activity
 */
export interface CreateActivityEvent {
  orgId: string;
  actorId: string;
  actorName?: string;
  actorAvatar?: string;
  type: string;
  title: string;
  description?: string;
  resourceType?: string;
  resourceId?: string;
  resourceName?: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class ActivitiesService {
  private readonly logger = new Logger(ActivitiesService.name);

  constructor(
    private readonly activitiesRepository: ActivitiesRepository,
    private readonly queueService: QueueService,
  ) {}

  /**
   * Queue an activity event for async processing.
   * IMPORTANT: This method never throws - activity logging
   * should not affect main operations.
   */
  async create(event: CreateActivityEvent): Promise<void> {
    try {
      await this.queueService.addJob('activities', event, {
        delay: 0,
      });
      this.logger.debug(`Queued activity event: ${event.type}`);
    } catch (error) {
      // Log error but don't throw - activity logging should never break operations
      this.logger.error('Failed to queue activity event', {
        error: error instanceof Error ? error.message : 'Unknown error',
        event,
      });
    }
  }

  /**
   * Find all activities with filters and pagination
   */
  async findAll(
    ctx: TenantContext,
    options: FindAllOptions,
  ): Promise<PaginatedActivitiesDto> {
    this.logger.debug(`Finding activities for org ${ctx.orgId}`);

    const result = await this.activitiesRepository.findAll(ctx, options);

    return {
      data: result.items.map((activity) => this.mapToDto(activity)),
      pagination: {
        cursor: result.nextCursor,
        hasMore: result.hasMore,
      },
    };
  }

  /**
   * Find recent activities (for dashboard widget)
   */
  async findRecent(ctx: TenantContext, limit: number): Promise<ActivityDto[]> {
    this.logger.debug(`Finding ${limit} recent activities for org ${ctx.orgId}`);

    const activities = await this.activitiesRepository.findRecent(ctx, limit);
    return activities.map((activity) => this.mapToDto(activity));
  }

  /**
   * Map database activity to DTO
   */
  private mapToDto(activity: Activity): ActivityDto {
    return {
      id: activity.id,
      type: activity.type,
      title: activity.title,
      description: activity.description || undefined,
      actor: {
        id: activity.actorId || '',
        name: activity.actorName || 'Unknown',
        avatar: activity.actorAvatar || undefined,
      },
      resource: activity.resourceType && activity.resourceId
        ? {
            type: activity.resourceType,
            id: activity.resourceId,
            name: activity.resourceName || '',
          }
        : undefined,
      aggregationCount: activity.aggregationCount || 1,
      metadata: activity.metadata ? (activity.metadata as Record<string, unknown>) : undefined,
      createdAt: activity.createdAt.toISOString(),
    };
  }
}

