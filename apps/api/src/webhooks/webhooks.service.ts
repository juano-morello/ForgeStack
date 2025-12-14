/**
 * Webhooks Service
 * Handles business logic for webhook endpoint management
 */

import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { type TenantContext } from '@forgestack/db';
import { WebhooksRepository } from './webhooks.repository';
import { QueueService } from '../queue/queue.service';
import { CreateEndpointDto, UpdateEndpointDto, DeliveryQueryDto } from './dto';
import { generateWebhookSecret } from './webhook-signing';
import type { WebhookEventType, WebhookPayload } from './webhook-events';
import { randomBytes } from 'crypto';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

const MAX_ENDPOINTS_PER_ORG = 10;
const WEBHOOK_DELIVERY_QUEUE = 'webhook-delivery';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    private readonly webhooksRepository: WebhooksRepository,
    private readonly queueService: QueueService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  /**
   * Create a new webhook endpoint (OWNER only)
   */
  async createEndpoint(ctx: TenantContext, dto: CreateEndpointDto) {
    this.logger.log(`Creating webhook endpoint for org ${ctx.orgId}`);

    // Verify caller is OWNER
    if (ctx.role !== 'OWNER') {
      throw new ForbiddenException('Only organization owners can create webhook endpoints');
    }

    // Check endpoint limit
    const count = await this.webhooksRepository.countEndpointsByOrgId(ctx.orgId);
    if (count >= MAX_ENDPOINTS_PER_ORG) {
      throw new BadRequestException(
        `Maximum of ${MAX_ENDPOINTS_PER_ORG} webhook endpoints per organization`
      );
    }

    // Generate secret
    const secret = generateWebhookSecret();

    const endpoint = await this.webhooksRepository.createEndpoint(ctx, {
      url: dto.url,
      description: dto.description,
      secret,
      events: dto.events,
      enabled: true,
    });

    this.logger.log(`Webhook endpoint ${endpoint.id} created for org ${ctx.orgId}`);

    return endpoint;
  }

  /**
   * List all webhook endpoints (OWNER only)
   */
  async listEndpoints(ctx: TenantContext) {
    this.logger.debug(`Listing webhook endpoints for org ${ctx.orgId}`);

    // Verify caller is OWNER
    if (ctx.role !== 'OWNER') {
      throw new ForbiddenException('Only organization owners can list webhook endpoints');
    }

    const endpoints = await this.webhooksRepository.findEndpointsByOrgId(ctx);

    // Mask secrets in list view
    return endpoints.map((endpoint) => ({
      ...endpoint,
      secret: this.maskSecret(endpoint.secret),
    }));
  }

  /**
   * Get a single webhook endpoint (OWNER only)
   */
  async getEndpoint(ctx: TenantContext, id: string) {
    this.logger.debug(`Getting webhook endpoint ${id} for org ${ctx.orgId}`);

    // Verify caller is OWNER
    if (ctx.role !== 'OWNER') {
      throw new ForbiddenException('Only organization owners can view webhook endpoints');
    }

    const endpoint = await this.webhooksRepository.findEndpointById(ctx, id);
    if (!endpoint) {
      throw new NotFoundException('Webhook endpoint not found');
    }

    // Mask secret
    return {
      ...endpoint,
      secret: this.maskSecret(endpoint.secret),
    };
  }

  /**
   * Update a webhook endpoint (OWNER only)
   */
  async updateEndpoint(ctx: TenantContext, id: string, dto: UpdateEndpointDto) {
    this.logger.log(`Updating webhook endpoint ${id} for org ${ctx.orgId}`);

    // Verify caller is OWNER
    if (ctx.role !== 'OWNER') {
      throw new ForbiddenException('Only organization owners can update webhook endpoints');
    }

    const existing = await this.webhooksRepository.findEndpointById(ctx, id);
    if (!existing) {
      throw new NotFoundException('Webhook endpoint not found');
    }

    const endpoint = await this.webhooksRepository.updateEndpoint(ctx, id, dto);
    if (!endpoint) {
      throw new NotFoundException('Webhook endpoint not found');
    }

    this.logger.log(`Webhook endpoint ${id} updated for org ${ctx.orgId}`);

    return {
      ...endpoint,
      secret: this.maskSecret(endpoint.secret),
    };
  }

  /**
   * Delete a webhook endpoint (OWNER only)
   */
  async deleteEndpoint(ctx: TenantContext, id: string) {
    this.logger.log(`Deleting webhook endpoint ${id} for org ${ctx.orgId}`);

    // Verify caller is OWNER
    if (ctx.role !== 'OWNER') {
      throw new ForbiddenException('Only organization owners can delete webhook endpoints');
    }

    const existing = await this.webhooksRepository.findEndpointById(ctx, id);
    if (!existing) {
      throw new NotFoundException('Webhook endpoint not found');
    }

    await this.webhooksRepository.deleteEndpoint(ctx, id);

    this.logger.log(`Webhook endpoint ${id} deleted for org ${ctx.orgId}`);
  }

  /**
   * Rotate webhook secret (OWNER only)
   */
  async rotateSecret(ctx: TenantContext, id: string) {
    this.logger.log(`Rotating secret for webhook endpoint ${id} in org ${ctx.orgId}`);

    // Verify caller is OWNER
    if (ctx.role !== 'OWNER') {
      throw new ForbiddenException('Only organization owners can rotate webhook secrets');
    }

    const existing = await this.webhooksRepository.findEndpointById(ctx, id);
    if (!existing) {
      throw new NotFoundException('Webhook endpoint not found');
    }

    // Generate new secret
    const secret = generateWebhookSecret();

    const endpoint = await this.webhooksRepository.updateEndpoint(ctx, id, { secret });
    if (!endpoint) {
      throw new NotFoundException('Webhook endpoint not found');
    }

    this.logger.log(`Secret rotated for webhook endpoint ${id} in org ${ctx.orgId}`);

    // Return full secret on rotation (only time it's shown)
    return endpoint;
  }

  /**
   * Test a webhook endpoint (OWNER only)
   */
  async testEndpoint(ctx: TenantContext, id: string) {
    this.logger.log(`Testing webhook endpoint ${id} for org ${ctx.orgId}`);

    // Verify caller is OWNER
    if (ctx.role !== 'OWNER') {
      throw new ForbiddenException('Only organization owners can test webhook endpoints');
    }

    const endpoint = await this.webhooksRepository.findEndpointById(ctx, id);
    if (!endpoint) {
      throw new NotFoundException('Webhook endpoint not found');
    }

    if (!endpoint.enabled) {
      throw new BadRequestException('Cannot test a disabled webhook endpoint');
    }

    // Dispatch test.ping event
    await this.dispatchEvent(ctx.orgId, 'test.ping', {
      message: 'This is a test webhook event',
      endpoint_id: endpoint.id,
    });

    this.logger.log(`Test event dispatched for webhook endpoint ${id}`);

    return { message: 'Test event queued for delivery' };
  }

  /**
   * Dispatch an event to subscribed webhook endpoints
   * This is called by other services when events occur
   */
  async dispatchEvent(orgId: string, eventType: WebhookEventType, data: Record<string, unknown>) {
    this.logger.debug(`Dispatching event ${eventType} for org ${orgId}`);

    try {
      // Find endpoints subscribed to this event
      const endpoints = await this.webhooksRepository.findEndpointsByEvent(orgId, eventType);

      if (endpoints.length === 0) {
        this.logger.debug(`No endpoints subscribed to ${eventType} for org ${orgId}`);
        return;
      }

      // Generate event ID
      const eventId = `evt_${randomBytes(16).toString('hex')}`;

      // Create payload
      const payload: WebhookPayload = {
        id: eventId,
        type: eventType,
        created_at: new Date().toISOString(),
        org_id: orgId,
        data,
      };

      // Create delivery records and queue jobs
      for (const endpoint of endpoints) {
        const delivery = await this.webhooksRepository.createDelivery({
          orgId,
          endpointId: endpoint.id,
          eventType,
          eventId,
          payload: payload as unknown as Record<string, unknown>,
          attemptNumber: 1,
        });

        // Queue delivery job (secret will be fetched from DB by worker)
        await this.queueService.addJob(WEBHOOK_DELIVERY_QUEUE, {
          deliveryId: delivery.id,
          endpointId: endpoint.id,
          orgId,
          url: endpoint.url,
          eventId,
          eventType,
          payload,
          attemptNumber: 1,
        });

        this.logger.debug(`Queued delivery ${delivery.id} for endpoint ${endpoint.id}`);
      }

      this.logger.log(`Dispatched event ${eventType} to ${endpoints.length} endpoints`);
    } catch (error) {
      // Don't throw - event dispatch failures shouldn't break the main operation
      this.logger.error(`Failed to dispatch event ${eventType} for org ${orgId}:`, error);
    }
  }

  /**
   * List webhook deliveries (OWNER only)
   */
  async listDeliveries(ctx: TenantContext, query: DeliveryQueryDto) {
    this.logger.debug(`Listing webhook deliveries for org ${ctx.orgId}`);

    // Verify caller is OWNER
    if (ctx.role !== 'OWNER') {
      throw new ForbiddenException('Only organization owners can view webhook deliveries');
    }

    return this.webhooksRepository.findDeliveriesByOrgId(ctx, {
      endpointId: query.endpointId,
      status: query.status,
      page: query.page,
      limit: query.limit,
    });
  }

  /**
   * Get a single webhook delivery (OWNER only)
   */
  async getDelivery(ctx: TenantContext, id: string) {
    this.logger.debug(`Getting webhook delivery ${id} for org ${ctx.orgId}`);

    // Verify caller is OWNER
    if (ctx.role !== 'OWNER') {
      throw new ForbiddenException('Only organization owners can view webhook deliveries');
    }

    const delivery = await this.webhooksRepository.findDeliveryById(ctx, id);
    if (!delivery) {
      throw new NotFoundException('Webhook delivery not found');
    }

    return delivery;
  }

  /**
   * Retry a failed webhook delivery (OWNER only)
   */
  async retryDelivery(ctx: TenantContext, id: string) {
    this.logger.log(`Retrying webhook delivery ${id} for org ${ctx.orgId}`);

    // Verify caller is OWNER
    if (ctx.role !== 'OWNER') {
      throw new ForbiddenException('Only organization owners can retry webhook deliveries');
    }

    const delivery = await this.webhooksRepository.findDeliveryById(ctx, id);
    if (!delivery) {
      throw new NotFoundException('Webhook delivery not found');
    }

    if (delivery.deliveredAt) {
      throw new BadRequestException('Cannot retry a successful delivery');
    }

    // Get endpoint
    const endpoint = await this.webhooksRepository.findEndpointById(ctx, delivery.endpointId);
    if (!endpoint) {
      throw new NotFoundException('Webhook endpoint not found');
    }

    // Reset delivery for retry
    await this.webhooksRepository.updateDelivery(id, {
      attemptNumber: delivery.attemptNumber + 1,
      nextRetryAt: null,
      failedAt: null,
      error: null,
    });

    // Queue delivery job (secret will be fetched from DB by worker)
    await this.queueService.addJob(WEBHOOK_DELIVERY_QUEUE, {
      deliveryId: delivery.id,
      endpointId: endpoint.id,
      orgId: delivery.orgId,
      url: endpoint.url,
      eventId: delivery.eventId,
      eventType: delivery.eventType,
      payload: delivery.payload,
      attemptNumber: delivery.attemptNumber + 1,
    });

    this.logger.log(`Webhook delivery ${id} queued for retry`);

    return { message: 'Delivery queued for retry' };
  }

  /**
   * Mask a webhook secret for display
   */
  private maskSecret(secret: string): string {
    if (secret.length <= 12) {
      return '***';
    }
    return `${secret.substring(0, 12)}${'*'.repeat(secret.length - 12)}`;
  }
}
