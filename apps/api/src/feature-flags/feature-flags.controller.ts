/**
 * Feature Flags Controller (Public)
 * Public endpoints for checking feature flags
 */

import { Controller, Get, Param, Logger } from '@nestjs/common';
import { type TenantContext } from '@forgestack/db';
import { CurrentTenant } from '../core/decorators/tenant-context.decorator';
import { FeatureFlagsService } from './feature-flags.service';
import { FeatureCheckDto, FeatureStatusDto } from './dto';

@Controller('features')
export class FeatureFlagsController {
  private readonly logger = new Logger(FeatureFlagsController.name);

  constructor(private readonly featureFlagsService: FeatureFlagsService) {}

  /**
   * GET /features
   * List all features with their enabled status for the current org
   */
  @Get()
  async listFeatures(@CurrentTenant() ctx: TenantContext): Promise<FeatureStatusDto[]> {
    this.logger.debug(`Listing features for org ${ctx.orgId}`);
    return this.featureFlagsService.getFeaturesWithStatus(ctx);
  }

  /**
   * GET /features/:key
   * Check if a specific feature is enabled
   */
  @Get(':key')
  async checkFeature(
    @Param('key') key: string,
    @CurrentTenant() ctx: TenantContext,
  ): Promise<FeatureCheckDto> {
    this.logger.debug(`Checking feature ${key} for org ${ctx.orgId}`);
    const enabled = await this.featureFlagsService.isEnabled(ctx, key);
    return { key, enabled };
  }
}

