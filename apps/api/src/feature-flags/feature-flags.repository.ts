/**
 * Feature Flags Repository
 * Handles all database operations for feature flags
 */

import { Injectable, Logger } from '@nestjs/common';
import {
  eq,
  and,
  withServiceContext,
  featureFlags,
  organizationFeatureOverrides,
  type FeatureFlag,
  type NewFeatureFlag,
  type OrganizationFeatureOverride,
  type NewOrganizationFeatureOverride,
} from '@forgestack/db';

@Injectable()
export class FeatureFlagsRepository {
  private readonly logger = new Logger(FeatureFlagsRepository.name);

  /**
   * Find all feature flags
   */
  async findAll(): Promise<FeatureFlag[]> {
    this.logger.debug('Finding all feature flags');

    return withServiceContext('FeatureFlagsRepository.findAll', async (tx) => {
      return tx.select().from(featureFlags);
    });
  }

  /**
   * Find feature flag by key
   */
  async findByKey(key: string): Promise<FeatureFlag | null> {
    this.logger.debug(`Finding feature flag by key: ${key}`);

    return withServiceContext('FeatureFlagsRepository.findByKey', async (tx) => {
      const [flag] = await tx
        .select()
        .from(featureFlags)
        .where(eq(featureFlags.key, key));
      return flag || null;
    });
  }

  /**
   * Find feature flag by ID
   */
  async findById(id: string): Promise<FeatureFlag | null> {
    this.logger.debug(`Finding feature flag by ID: ${id}`);

    return withServiceContext('FeatureFlagsRepository.findById', async (tx) => {
      const [flag] = await tx
        .select()
        .from(featureFlags)
        .where(eq(featureFlags.id, id));
      return flag || null;
    });
  }

  /**
   * Create a new feature flag
   */
  async create(data: NewFeatureFlag): Promise<FeatureFlag> {
    this.logger.debug(`Creating feature flag: ${data.key}`);

    return withServiceContext('FeatureFlagsRepository.create', async (tx) => {
      const [flag] = await tx
        .insert(featureFlags)
        .values(data)
        .returning();
      return flag;
    });
  }

  /**
   * Update a feature flag
   */
  async update(id: string, data: Partial<NewFeatureFlag>): Promise<FeatureFlag | null> {
    this.logger.debug(`Updating feature flag: ${id}`);

    return withServiceContext('FeatureFlagsRepository.update', async (tx) => {
      const [flag] = await tx
        .update(featureFlags)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(featureFlags.id, id))
        .returning();
      return flag || null;
    });
  }

  /**
   * Delete a feature flag
   */
  async delete(id: string): Promise<boolean> {
    this.logger.debug(`Deleting feature flag: ${id}`);

    return withServiceContext('FeatureFlagsRepository.delete', async (tx) => {
      const result = await tx
        .delete(featureFlags)
        .where(eq(featureFlags.id, id));
      return result.rowCount ? result.rowCount > 0 : false;
    });
  }

  /**
   * Find all overrides for an organization
   */
  async findOverridesByOrgId(orgId: string): Promise<OrganizationFeatureOverride[]> {
    this.logger.debug(`Finding overrides for org: ${orgId}`);

    return withServiceContext('FeatureFlagsRepository.findOverridesByOrgId', async (tx) => {
      return tx
        .select()
        .from(organizationFeatureOverrides)
        .where(eq(organizationFeatureOverrides.orgId, orgId));
    });
  }

  /**
   * Find specific override
   */
  async findOverride(orgId: string, flagId: string): Promise<OrganizationFeatureOverride | null> {
    this.logger.debug(`Finding override for org ${orgId} and flag ${flagId}`);

    return withServiceContext('FeatureFlagsRepository.findOverride', async (tx) => {
      const [override] = await tx
        .select()
        .from(organizationFeatureOverrides)
        .where(
          and(
            eq(organizationFeatureOverrides.orgId, orgId),
            eq(organizationFeatureOverrides.flagId, flagId)
          )
        );
      return override || null;
    });
  }




  /**
   * Create an override
   */
  async createOverride(data: NewOrganizationFeatureOverride): Promise<OrganizationFeatureOverride> {
    this.logger.debug(`Creating override for org ${data.orgId} and flag ${data.flagId}`);

    return withServiceContext('FeatureFlagsRepository.createOverride', async (tx) => {
      const [override] = await tx
        .insert(organizationFeatureOverrides)
        .values(data)
        .returning();
      return override;
    });
  }

  /**
   * Update an override
   */
  async updateOverride(id: string, data: Partial<NewOrganizationFeatureOverride>): Promise<OrganizationFeatureOverride | null> {
    this.logger.debug(`Updating override: ${id}`);

    return withServiceContext('FeatureFlagsRepository.updateOverride', async (tx) => {
      const [override] = await tx
        .update(organizationFeatureOverrides)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(organizationFeatureOverrides.id, id))
        .returning();
      return override || null;
    });
  }

  /**
   * Delete an override
   */
  async deleteOverride(orgId: string, flagId: string): Promise<boolean> {
    this.logger.debug(`Deleting override for org ${orgId} and flag ${flagId}`);

    return withServiceContext('FeatureFlagsRepository.deleteOverride', async (tx) => {
      const result = await tx
        .delete(organizationFeatureOverrides)
        .where(
          and(
            eq(organizationFeatureOverrides.orgId, orgId),
            eq(organizationFeatureOverrides.flagId, flagId)
          )
        );
      return result.rowCount ? result.rowCount > 0 : false;
    });
  }
}