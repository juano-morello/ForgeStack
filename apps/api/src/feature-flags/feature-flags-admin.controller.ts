/**
 * Feature Flags Admin Controller
 * Admin endpoints for managing feature flags (OWNER only)
 */

import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Logger,
  ParseUUIDPipe,
} from '@nestjs/common';
import { type TenantContext } from '@forgestack/db';
import { CurrentTenant } from '../core/decorators/tenant-context.decorator';
import { RequirePermission } from '../core/decorators/require-permission.decorator';
import { FeatureFlagsService } from './feature-flags.service';
import { CreateFeatureFlagDto, UpdateFeatureFlagDto, CreateOverrideDto } from './dto';

@Controller('admin/feature-flags')
@RequirePermission('feature_flags:manage')
export class FeatureFlagsAdminController {
  private readonly logger = new Logger(FeatureFlagsAdminController.name);

  constructor(private readonly featureFlagsService: FeatureFlagsService) {}

  /**
   * GET /admin/feature-flags
   * List all feature flags
   */
  @Get()
  async listFlags() {
    this.logger.debug('GET /admin/feature-flags');
    return this.featureFlagsService.findAll();
  }

  /**
   * POST /admin/feature-flags
   * Create a new feature flag
   */
  @Post()
  async createFlag(@CurrentTenant() ctx: TenantContext, @Body() dto: CreateFeatureFlagDto) {
    this.logger.log('POST /admin/feature-flags');
    return this.featureFlagsService.create(dto);
  }

  /**
   * PATCH /admin/feature-flags/:id
   * Update a feature flag
   */
  @Patch(':id')
  async updateFlag(
    @CurrentTenant() ctx: TenantContext,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateFeatureFlagDto,
  ) {
    this.logger.log(`PATCH /admin/feature-flags/${id}`);
    return this.featureFlagsService.update(id, dto);
  }

  /**
   * DELETE /admin/feature-flags/:id
   * Delete a feature flag
   */
  @Delete(':id')
  async deleteFlag(@CurrentTenant() ctx: TenantContext, @Param('id', ParseUUIDPipe) id: string) {
    this.logger.log(`DELETE /admin/feature-flags/${id}`);
    await this.featureFlagsService.delete(id);
    return { message: 'Feature flag deleted successfully' };
  }

  /**
   * GET /admin/feature-flags/:id/overrides
   * List overrides for a flag
   */
  @Get(':id/overrides')
  async listOverrides(@CurrentTenant() ctx: TenantContext, @Param('id', ParseUUIDPipe) id: string) {
    this.logger.debug(`GET /admin/feature-flags/${id}/overrides`);
    return this.featureFlagsService.getOverridesForFlag(id);
  }

  /**
   * POST /admin/feature-flags/:id/overrides
   * Add an organization override
   */
  @Post(':id/overrides')
  async createOverride(
    @CurrentTenant() ctx: TenantContext,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateOverrideDto,
  ) {
    this.logger.log(`POST /admin/feature-flags/${id}/overrides`);
    return this.featureFlagsService.createOverride(id, dto);
  }

  /**
   * DELETE /admin/feature-flags/:id/overrides/:orgId
   * Remove an organization override
   */
  @Delete(':id/overrides/:orgId')
  async deleteOverride(
    @CurrentTenant() ctx: TenantContext,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('orgId', ParseUUIDPipe) orgId: string,
  ) {
    this.logger.log(`DELETE /admin/feature-flags/${id}/overrides/${orgId}`);
    await this.featureFlagsService.deleteOverride(id, orgId);
    return { message: 'Override deleted successfully' };
  }
}

