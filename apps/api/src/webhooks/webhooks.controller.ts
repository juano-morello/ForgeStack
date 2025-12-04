/**
 * Webhooks Controller
 * REST API endpoints for webhook endpoint management
 */

import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { WebhooksService } from './webhooks.service';
import { CreateEndpointDto, UpdateEndpointDto, DeliveryQueryDto } from './dto';
import { CurrentTenant } from '../core/decorators/tenant-context.decorator';
import { type TenantContext } from '@forgestack/db';

@ApiTags('Webhooks')
@ApiBearerAuth()
@Controller('webhooks')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(private readonly webhooksService: WebhooksService) {}

  /**
   * POST /webhooks/endpoints
   * Create a new webhook endpoint (OWNER only)
   */
  @Post('endpoints')
  @ApiOperation({ summary: 'Create webhook endpoint', description: 'Create a new webhook endpoint (OWNER only)' })
  @ApiResponse({ status: 201, description: 'Webhook endpoint created' })
  @ApiResponse({ status: 403, description: 'Forbidden - OWNER role required' })
  async createEndpoint(@CurrentTenant() ctx: TenantContext, @Body() dto: CreateEndpointDto) {
    this.logger.debug(`POST /webhooks/endpoints for org ${ctx.orgId}`);
    return this.webhooksService.createEndpoint(ctx, dto);
  }

  /**
   * GET /webhooks/endpoints
   * List all webhook endpoints (OWNER only)
   */
  @Get('endpoints')
  async listEndpoints(@CurrentTenant() ctx: TenantContext) {
    this.logger.debug(`GET /webhooks/endpoints for org ${ctx.orgId}`);
    return this.webhooksService.listEndpoints(ctx);
  }

  /**
   * GET /webhooks/endpoints/:id
   * Get a specific webhook endpoint (OWNER only)
   */
  @Get('endpoints/:id')
  async getEndpoint(@CurrentTenant() ctx: TenantContext, @Param('id') id: string) {
    this.logger.debug(`GET /webhooks/endpoints/${id} for org ${ctx.orgId}`);
    return this.webhooksService.getEndpoint(ctx, id);
  }

  /**
   * PATCH /webhooks/endpoints/:id
   * Update a webhook endpoint (OWNER only)
   */
  @Patch('endpoints/:id')
  async updateEndpoint(
    @CurrentTenant() ctx: TenantContext,
    @Param('id') id: string,
    @Body() dto: UpdateEndpointDto
  ) {
    this.logger.debug(`PATCH /webhooks/endpoints/${id} for org ${ctx.orgId}`);
    return this.webhooksService.updateEndpoint(ctx, id, dto);
  }

  /**
   * DELETE /webhooks/endpoints/:id
   * Delete a webhook endpoint (OWNER only)
   */
  @Delete('endpoints/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteEndpoint(@CurrentTenant() ctx: TenantContext, @Param('id') id: string) {
    this.logger.debug(`DELETE /webhooks/endpoints/${id} for org ${ctx.orgId}`);
    await this.webhooksService.deleteEndpoint(ctx, id);
  }

  /**
   * POST /webhooks/endpoints/:id/test
   * Send a test event to a webhook endpoint (OWNER only)
   */
  @Post('endpoints/:id/test')
  async testEndpoint(@CurrentTenant() ctx: TenantContext, @Param('id') id: string) {
    this.logger.debug(`POST /webhooks/endpoints/${id}/test for org ${ctx.orgId}`);
    return this.webhooksService.testEndpoint(ctx, id);
  }

  /**
   * POST /webhooks/endpoints/:id/rotate-secret
   * Regenerate the webhook secret (OWNER only)
   */
  @Post('endpoints/:id/rotate-secret')
  async rotateSecret(@CurrentTenant() ctx: TenantContext, @Param('id') id: string) {
    this.logger.debug(`POST /webhooks/endpoints/${id}/rotate-secret for org ${ctx.orgId}`);
    return this.webhooksService.rotateSecret(ctx, id);
  }

  /**
   * GET /webhooks/deliveries
   * List webhook deliveries with filters (OWNER only)
   */
  @Get('deliveries')
  async listDeliveries(@CurrentTenant() ctx: TenantContext, @Query() query: DeliveryQueryDto) {
    this.logger.debug(`GET /webhooks/deliveries for org ${ctx.orgId}`);
    return this.webhooksService.listDeliveries(ctx, query);
  }

  /**
   * GET /webhooks/deliveries/:id
   * Get a specific webhook delivery (OWNER only)
   */
  @Get('deliveries/:id')
  async getDelivery(@CurrentTenant() ctx: TenantContext, @Param('id') id: string) {
    this.logger.debug(`GET /webhooks/deliveries/${id} for org ${ctx.orgId}`);
    return this.webhooksService.getDelivery(ctx, id);
  }

  /**
   * POST /webhooks/deliveries/:id/retry
   * Manually retry a failed delivery (OWNER only)
   */
  @Post('deliveries/:id/retry')
  async retryDelivery(@CurrentTenant() ctx: TenantContext, @Param('id') id: string) {
    this.logger.debug(`POST /webhooks/deliveries/${id}/retry for org ${ctx.orgId}`);
    return this.webhooksService.retryDelivery(ctx, id);
  }
}

