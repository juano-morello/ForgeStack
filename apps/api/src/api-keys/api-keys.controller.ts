/**
 * API Keys Controller
 * REST API endpoints for API key management
 */

import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  Logger,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { ApiKeysService } from './api-keys.service';
import { CreateApiKeyDto, UpdateApiKeyDto } from './dto';
import { CurrentTenant } from '../core/decorators/tenant-context.decorator';
import { type TenantContext } from '@forgestack/db';

@ApiTags('API Keys')
@ApiBearerAuth()
@Controller('api-keys')
export class ApiKeysController {
  private readonly logger = new Logger(ApiKeysController.name);

  constructor(private readonly apiKeysService: ApiKeysService) {}

  /**
   * POST /api-keys
   * Create a new API key (OWNER only)
   */
  @Post()
  @ApiOperation({ summary: 'Create API key', description: 'Create a new API key (OWNER only)' })
  @ApiResponse({ status: 201, description: 'API key created successfully. Key is only shown once.' })
  @ApiResponse({ status: 403, description: 'Forbidden - OWNER role required' })
  async create(@CurrentTenant() ctx: TenantContext, @Body() dto: CreateApiKeyDto) {
    this.logger.debug(`POST /api-keys for org ${ctx.orgId}`);

    // Only OWNER can create API keys
    if (ctx.role !== 'OWNER') {
      throw new ForbiddenException('Only organization owners can create API keys');
    }

    return this.apiKeysService.createKey(ctx, dto);
  }

  /**
   * GET /api-keys
   * List all API keys (OWNER only)
   */
  @Get()
  @ApiOperation({ summary: 'List API keys', description: 'List all API keys for the organization (OWNER only)' })
  @ApiResponse({ status: 200, description: 'List of API keys' })
  @ApiResponse({ status: 403, description: 'Forbidden - OWNER role required' })
  async findAll(@CurrentTenant() ctx: TenantContext) {
    this.logger.debug(`GET /api-keys for org ${ctx.orgId}`);

    // Only OWNER can list API keys
    if (ctx.role !== 'OWNER') {
      throw new ForbiddenException('Only organization owners can list API keys');
    }

    return this.apiKeysService.listKeys(ctx);
  }

  /**
   * GET /api-keys/:id
   * Get a single API key (OWNER only)
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get API key', description: 'Get a single API key by ID (OWNER only)' })
  @ApiParam({ name: 'id', description: 'API Key UUID' })
  @ApiResponse({ status: 200, description: 'API key found' })
  @ApiResponse({ status: 403, description: 'Forbidden - OWNER role required' })
  @ApiResponse({ status: 404, description: 'API key not found' })
  async findOne(@CurrentTenant() ctx: TenantContext, @Param('id') id: string) {
    this.logger.debug(`GET /api-keys/${id} for org ${ctx.orgId}`);

    // Only OWNER can view API keys
    if (ctx.role !== 'OWNER') {
      throw new ForbiddenException('Only organization owners can view API keys');
    }

    return this.apiKeysService.getKey(ctx, id);
  }

  /**
   * PATCH /api-keys/:id
   * Update an API key (OWNER only)
   */
  @Patch(':id')
  async update(
    @CurrentTenant() ctx: TenantContext,
    @Param('id') id: string,
    @Body() dto: UpdateApiKeyDto,
  ) {
    this.logger.debug(`PATCH /api-keys/${id} for org ${ctx.orgId}`);

    // Only OWNER can update API keys
    if (ctx.role !== 'OWNER') {
      throw new ForbiddenException('Only organization owners can update API keys');
    }

    return this.apiKeysService.updateKey(ctx, id, dto);
  }

  /**
   * DELETE /api-keys/:id
   * Revoke an API key (OWNER only)
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async revoke(@CurrentTenant() ctx: TenantContext, @Param('id') id: string) {
    this.logger.debug(`DELETE /api-keys/${id} for org ${ctx.orgId}`);

    // Only OWNER can revoke API keys
    if (ctx.role !== 'OWNER') {
      throw new ForbiddenException('Only organization owners can revoke API keys');
    }

    return this.apiKeysService.revokeKey(ctx, id);
  }

  /**
   * POST /api-keys/:id/rotate
   * Rotate an API key (OWNER only)
   */
  @Post(':id/rotate')
  async rotate(@CurrentTenant() ctx: TenantContext, @Param('id') id: string) {
    this.logger.debug(`POST /api-keys/${id}/rotate for org ${ctx.orgId}`);

    // Only OWNER can rotate API keys
    if (ctx.role !== 'OWNER') {
      throw new ForbiddenException('Only organization owners can rotate API keys');
    }

    return this.apiKeysService.rotateKey(ctx, id);
  }
}

