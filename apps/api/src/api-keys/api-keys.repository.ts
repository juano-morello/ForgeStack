/**
 * API Keys Repository
 * Handles all database operations for API keys
 */

import { Injectable, Logger } from '@nestjs/common';
import {
  eq,
  and,
  isNull,
  count,
  withServiceContext,
  withTenantContext,
  apiKeys,
  type TenantContext,
  type ApiKey,
  type NewApiKey,
} from '@forgestack/db';

@Injectable()
export class ApiKeysRepository {
  private readonly logger = new Logger(ApiKeysRepository.name);

  /**
   * Create a new API key within tenant context
   */
  async create(ctx: TenantContext, data: Omit<NewApiKey, 'orgId'>): Promise<ApiKey> {
    this.logger.debug(`Creating API key "${data.name}" in org ${ctx.orgId}`);

    return withTenantContext(ctx, async (tx) => {
      const [apiKey] = await tx
        .insert(apiKeys)
        .values({
          ...data,
          orgId: ctx.orgId,
        })
        .returning();

      return apiKey;
    });
  }

  /**
   * Find an API key by ID within tenant context
   */
  async findById(ctx: TenantContext, id: string): Promise<ApiKey | null> {
    this.logger.debug(`Finding API key ${id} in org ${ctx.orgId}`);

    return withTenantContext(ctx, async (tx) => {
      const [apiKey] = await tx
        .select()
        .from(apiKeys)
        .where(eq(apiKeys.id, id));

      return apiKey || null;
    });
  }

  /**
   * Find an API key by hash (for authentication)
   * Uses service context to bypass RLS since we need to look up by hash
   */
  async findByKeyHash(keyHash: string): Promise<ApiKey | null> {
    this.logger.debug('Finding API key by hash');

    return withServiceContext('ApiKeysRepository.findByKeyHash', async (tx) => {
      const [apiKey] = await tx
        .select()
        .from(apiKeys)
        .where(
          and(
            eq(apiKeys.keyHash, keyHash),
            isNull(apiKeys.revokedAt)
          )
        );

      return apiKey || null;
    });
  }

  /**
   * Find all API keys for an organization
   */
  async findAll(ctx: TenantContext): Promise<ApiKey[]> {
    this.logger.debug(`Finding all API keys for org ${ctx.orgId}`);

    return withTenantContext(ctx, async (tx) => {
      return await tx
        .select()
        .from(apiKeys)
        .where(eq(apiKeys.orgId, ctx.orgId))
        .orderBy(apiKeys.createdAt);
    });
  }

  /**
   * Update an API key within tenant context
   */
  async update(
    ctx: TenantContext,
    id: string,
    data: Partial<Pick<ApiKey, 'name' | 'scopes'>>
  ): Promise<ApiKey | null> {
    this.logger.debug(`Updating API key ${id} in org ${ctx.orgId}`);

    return withTenantContext(ctx, async (tx) => {
      const [apiKey] = await tx
        .update(apiKeys)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(eq(apiKeys.id, id))
        .returning();

      return apiKey || null;
    });
  }

  /**
   * Revoke an API key (soft delete)
   */
  async revoke(ctx: TenantContext, id: string): Promise<ApiKey | null> {
    this.logger.debug(`Revoking API key ${id} in org ${ctx.orgId}`);

    return withTenantContext(ctx, async (tx) => {
      const [apiKey] = await tx
        .update(apiKeys)
        .set({
          revokedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(apiKeys.id, id))
        .returning();

      return apiKey || null;
    });
  }

  /**
   * Update last used timestamp
   * Uses service context for performance (non-blocking)
   */
  async updateLastUsed(id: string): Promise<void> {
    this.logger.debug(`Updating last used timestamp for API key ${id}`);

    await withServiceContext('ApiKeysRepository.updateLastUsed', async (tx) => {
      await tx
        .update(apiKeys)
        .set({ lastUsedAt: new Date() })
        .where(eq(apiKeys.id, id));
    });
  }

  /**
   * Count API keys in an organization within tenant context
   */
  async count(ctx: TenantContext): Promise<number> {
    this.logger.debug(`Counting API keys in org ${ctx.orgId}`);

    return withTenantContext(ctx, async (tx) => {
      const [result] = await tx
        .select({ count: count() })
        .from(apiKeys)
        .where(isNull(apiKeys.revokedAt));

      return Number(result?.count ?? 0);
    });
  }
}

