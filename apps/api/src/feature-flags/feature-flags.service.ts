/**
 * Feature Flags Service
 * Handles feature flag evaluation and management
 */

import { Injectable, Logger, NotFoundException, ConflictException } from '@nestjs/common';
import { type TenantContext, eq, subscriptions, withServiceContext, organizationFeatureOverrides } from '@forgestack/db';
import { FeatureFlagsRepository } from './feature-flags.repository';
import { CreateFeatureFlagDto, UpdateFeatureFlagDto, CreateOverrideDto, FeatureStatusDto } from './dto';

@Injectable()
export class FeatureFlagsService {
  private readonly logger = new Logger(FeatureFlagsService.name);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private flagCache: Map<string, any> = new Map();
  private cacheTimestamps: Map<string, number> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor(private readonly repository: FeatureFlagsRepository) {}

  /**
   * Check if a feature is enabled for the current organization
   */
  async isEnabled(ctx: TenantContext, flagKey: string): Promise<boolean> {
    this.logger.debug(`Checking if feature ${flagKey} is enabled for org ${ctx.orgId}`);

    // Get flag definition
    const flag = await this.getFlag(flagKey);
    if (!flag || !flag.enabled) {
      return false;
    }

    // Check for org override
    const override = await this.repository.findOverride(ctx.orgId, flag.id);
    if (override) {
      return override.enabled;
    }

    // Evaluate by type
    switch (flag.type) {
      case 'boolean':
        return flag.defaultValue;
      case 'plan': {
        const plan = await this.getOrgPlan(ctx.orgId);
        return flag.plans?.includes(plan) ?? false;
      }
      case 'percentage':
        return this.hashOrgId(ctx.orgId) < (flag.percentage ?? 0);
      default:
        return flag.defaultValue;
    }
  }

  /**
   * Get all enabled feature keys for an organization
   */
  async getEnabledFeatures(ctx: TenantContext): Promise<string[]> {
    this.logger.debug(`Getting enabled features for org ${ctx.orgId}`);

    const allFlags = await this.getAllFlags();
    const enabled: string[] = [];

    for (const flag of allFlags) {
      if (await this.isEnabled(ctx, flag.key)) {
        enabled.push(flag.key);
      }
    }

    return enabled;
  }

  /**
   * Get all features with their enabled status for display
   */
  async getFeaturesWithStatus(ctx: TenantContext): Promise<FeatureStatusDto[]> {
    this.logger.debug(`Getting features with status for org ${ctx.orgId}`);

    const allFlags = await this.getAllFlags();
    const results: FeatureStatusDto[] = [];

    for (const flag of allFlags) {
      const enabled = await this.isEnabled(ctx, flag.key);
      results.push({
        key: flag.key,
        name: flag.name,
        description: flag.description,
        enabled,
        requiredPlan: !enabled && flag.type === 'plan' ? flag.plans?.[0] : undefined,
      });
    }

    return results;
  }

  /**
   * List all flags (admin)
   */
  async findAll() {
    this.logger.debug('Finding all feature flags');
    return this.repository.findAll();
  }

  /**
   * Create a new flag (admin)
   */
  async create(dto: CreateFeatureFlagDto) {
    this.logger.log(`Creating feature flag: ${dto.key}`);

    // Check if key already exists
    const existing = await this.repository.findByKey(dto.key);
    if (existing) {
      throw new ConflictException(`Feature flag with key "${dto.key}" already exists`);
    }

    const flag = await this.repository.create({
      key: dto.key,
      name: dto.name,
      description: dto.description || null,
      type: dto.type,
      defaultValue: dto.defaultValue ?? false,
      plans: dto.plans || null,
      percentage: dto.percentage ?? null,
      enabled: dto.enabled ?? true,
    });

    this.invalidateFlagCache(dto.key);
    return flag;
  }

  /**
   * Update a flag (admin)
   */
  async update(id: string, dto: UpdateFeatureFlagDto) {
    this.logger.log(`Updating feature flag: ${id}`);

    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundException('Feature flag not found');
    }

    const flag = await this.repository.update(id, dto);
    this.invalidateFlagCache(existing.key);
    return flag;
  }

  /**
   * Delete a flag (admin)
   */
  async delete(id: string) {
    this.logger.log(`Deleting feature flag: ${id}`);

    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundException('Feature flag not found');
    }

    await this.repository.delete(id);
    this.invalidateFlagCache(existing.key);
  }

  /**
   * Create an override (admin)
   */
  async createOverride(flagId: string, dto: CreateOverrideDto) {
    this.logger.log(`Creating override for flag ${flagId} and org ${dto.orgId}`);

    const flag = await this.repository.findById(flagId);
    if (!flag) {
      throw new NotFoundException('Feature flag not found');
    }

    // Check if override already exists
    const existing = await this.repository.findOverride(dto.orgId, flagId);
    if (existing) {
      throw new ConflictException('Override already exists for this organization');
    }

    return this.repository.createOverride({
      orgId: dto.orgId,
      flagId,
      enabled: dto.enabled,
      reason: dto.reason || null,
    });
  }

  /**
   * Delete an override (admin)
   */
  async deleteOverride(flagId: string, orgId: string) {
    this.logger.log(`Deleting override for flag ${flagId} and org ${orgId}`);

    const flag = await this.repository.findById(flagId);
    if (!flag) {
      throw new NotFoundException('Feature flag not found');
    }

    const deleted = await this.repository.deleteOverride(orgId, flagId);
    if (!deleted) {
      throw new NotFoundException('Override not found');
    }
  }

  /**
   * Get overrides for a flag (admin)
   */
  async getOverridesForFlag(flagId: string) {
    this.logger.debug(`Getting overrides for flag ${flagId}`);

    const flag = await this.repository.findById(flagId);
    if (!flag) {
      throw new NotFoundException('Feature flag not found');
    }

    // Get all overrides and filter by flagId
    const allOverrides = await withServiceContext('FeatureFlagsService.getOverridesForFlag', async (tx) => {
      return tx
        .select()
        .from(organizationFeatureOverrides)
        .where(eq(organizationFeatureOverrides.flagId, flagId));
    });

    return allOverrides;
  }

  /**
   * Get flag by key (with caching)
   */
  private async getFlag(key: string) {
    const cacheKey = `flag:${key}`;
    const now = Date.now();
    const timestamp = this.cacheTimestamps.get(cacheKey);

    if (timestamp && now - timestamp < this.CACHE_TTL && this.flagCache.has(cacheKey)) {
      return this.flagCache.get(cacheKey);
    }

    const flag = await this.repository.findByKey(key);
    if (flag) {
      this.flagCache.set(cacheKey, flag);
      this.cacheTimestamps.set(cacheKey, now);
    }

    return flag;
  }

  /**
   * Get all flags (with caching)
   */
  private async getAllFlags() {
    const cacheKey = 'all_flags';
    const now = Date.now();
    const timestamp = this.cacheTimestamps.get(cacheKey);

    if (timestamp && now - timestamp < this.CACHE_TTL && this.flagCache.has(cacheKey)) {
      return this.flagCache.get(cacheKey);
    }

    const flags = await this.repository.findAll();
    this.flagCache.set(cacheKey, flags);
    this.cacheTimestamps.set(cacheKey, now);

    return flags;
  }

  /**
   * Get organization's subscription plan
   */
  private async getOrgPlan(orgId: string): Promise<string> {
    const subscription = await withServiceContext('FeatureFlagsService.getOrgPlan', async (tx) => {
      const [sub] = await tx
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.orgId, orgId))
        .limit(1);
      return sub;
    });

    return subscription?.plan || 'free';
  }

  /**
   * Consistent hash for percentage rollouts
   */
  private hashOrgId(orgId: string): number {
    let hash = 0;
    for (let i = 0; i < orgId.length; i++) {
      hash = ((hash << 5) - hash) + orgId.charCodeAt(i);
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash) % 100;
  }

  /**
   * Invalidate flag cache
   */
  private invalidateFlagCache(key: string) {
    this.flagCache.delete(`flag:${key}`);
    this.flagCache.delete('all_flags');
    this.cacheTimestamps.delete(`flag:${key}`);
    this.cacheTimestamps.delete('all_flags');
  }
}
