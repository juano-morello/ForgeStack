/**
 * API Keys Service
 * Business logic for API key management
 */

import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { timingSafeEqual } from 'crypto';
import { type TenantContext } from '@forgestack/db';
import { ApiKeysRepository } from './api-keys.repository';
import { CreateApiKeyDto, UpdateApiKeyDto, ApiKeyDto, ApiKeyCreatedDto } from './dto';
import {
  generateApiKey,
  hashApiKey,
  extractKeyPrefix,
  validateScopes,
} from './key-utils';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

@Injectable()
export class ApiKeysService {
  private readonly logger = new Logger(ApiKeysService.name);

  constructor(
    private readonly apiKeysRepository: ApiKeysRepository,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  /**
   * Create a new API key
   * Returns the full key only once
   */
  async createKey(ctx: TenantContext, dto: CreateApiKeyDto): Promise<ApiKeyCreatedDto> {
    this.logger.log(`Creating API key "${dto.name}" for org ${ctx.orgId}`);

    // Validate scopes
    if (!validateScopes(dto.scopes)) {
      throw new BadRequestException('Invalid scopes provided');
    }

    // Generate key
    const plainKey = generateApiKey('live');
    const keyHash = hashApiKey(plainKey);
    const keyPrefix = extractKeyPrefix(plainKey);

    // Store in database
    const apiKey = await this.apiKeysRepository.create(ctx, {
      name: dto.name,
      keyPrefix,
      keyHash,
      scopes: dto.scopes,
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      createdBy: ctx.userId,
    });

    // Log audit event (don't log the actual key value)
    await this.auditLogsService.log(
      {
        orgId: ctx.orgId,
        actorId: ctx.userId,
        actorType: 'user',
      },
      {
        action: 'api_key.created',
        resourceType: 'api_key',
        resourceId: apiKey.id,
        resourceName: apiKey.name,
        metadata: {
          keyPrefix: apiKey.keyPrefix,
          scopes: apiKey.scopes,
        },
      },
    );

    // Return with full key (only time it's shown)
    return {
      id: apiKey.id,
      name: apiKey.name,
      keyPrefix: apiKey.keyPrefix,
      key: plainKey, // Full key shown only once
      scopes: apiKey.scopes,
      lastUsedAt: apiKey.lastUsedAt?.toISOString() || null,
      expiresAt: apiKey.expiresAt?.toISOString() || null,
      revokedAt: apiKey.revokedAt?.toISOString() || null,
      createdAt: apiKey.createdAt.toISOString(),
      isRevoked: !!apiKey.revokedAt,
    };
  }

  /**
   * List all API keys for the organization
   */
  async listKeys(ctx: TenantContext): Promise<{ data: ApiKeyDto[]; total: number }> {
    this.logger.log(`Listing API keys for org ${ctx.orgId}`);

    const keys = await this.apiKeysRepository.findAll(ctx);

    const data = keys.map((key) => this.toApiKeyDto(key));

    return { data, total: data.length };
  }

  /**
   * Get a single API key by ID
   */
  async getKey(ctx: TenantContext, id: string): Promise<ApiKeyDto> {
    this.logger.log(`Getting API key ${id} for org ${ctx.orgId}`);

    const key = await this.apiKeysRepository.findById(ctx, id);
    if (!key) {
      throw new NotFoundException('API key not found');
    }

    return this.toApiKeyDto(key);
  }

  /**
   * Update an API key
   */
  async updateKey(ctx: TenantContext, id: string, dto: UpdateApiKeyDto): Promise<ApiKeyDto> {
    this.logger.log(`Updating API key ${id} for org ${ctx.orgId}`);

    // Validate scopes if provided
    if (dto.scopes && !validateScopes(dto.scopes)) {
      throw new BadRequestException('Invalid scopes provided');
    }

    const key = await this.apiKeysRepository.update(ctx, id, dto);
    if (!key) {
      throw new NotFoundException('API key not found');
    }

    return this.toApiKeyDto(key);
  }

  /**
   * Revoke an API key
   */
  async revokeKey(ctx: TenantContext, id: string): Promise<{ message: string; revokedAt: string }> {
    this.logger.log(`Revoking API key ${id} for org ${ctx.orgId}`);

    const key = await this.apiKeysRepository.revoke(ctx, id);
    if (!key) {
      throw new NotFoundException('API key not found');
    }

    // Log audit event
    await this.auditLogsService.log(
      {
        orgId: ctx.orgId,
        actorId: ctx.userId,
        actorType: 'user',
      },
      {
        action: 'api_key.revoked',
        resourceType: 'api_key',
        resourceId: key.id,
        resourceName: key.name,
        metadata: {
          keyPrefix: key.keyPrefix,
        },
      },
    );

    // TODO: Implement scheduled cleanup job to hard-delete API keys
    // that have been revoked for more than 90 days to prevent database bloat.
    // See apps/worker/src/handlers/ for job handler pattern.
    // The job should:
    // 1. Query for API keys where revokedAt < (now - 90 days)
    // 2. Hard delete those records from the database
    // 3. Log the number of deleted keys for monitoring

    return {
      message: 'API key has been revoked',
      revokedAt: key.revokedAt!.toISOString(),
    };
  }

  /**
   * Rotate an API key
   * Creates a new key with the same name and scopes, revokes the old one
   */
  async rotateKey(ctx: TenantContext, id: string): Promise<ApiKeyCreatedDto & { previousKeyId: string }> {
    this.logger.log(`Rotating API key ${id} for org ${ctx.orgId}`);

    // Get the old key
    const oldKey = await this.apiKeysRepository.findById(ctx, id);
    if (!oldKey) {
      throw new NotFoundException('API key not found');
    }

    // Create new key with same name and scopes
    const newKey = await this.createKey(ctx, {
      name: oldKey.name,
      scopes: oldKey.scopes,
      expiresAt: oldKey.expiresAt?.toISOString(),
    });

    // Revoke old key
    await this.apiKeysRepository.revoke(ctx, id);

    // Log audit event for rotation
    await this.auditLogsService.log(
      {
        orgId: ctx.orgId,
        actorId: ctx.userId,
        actorType: 'user',
      },
      {
        action: 'api_key.rotated',
        resourceType: 'api_key',
        resourceId: newKey.id,
        resourceName: newKey.name,
        metadata: {
          previousKeyId: id,
          previousKeyPrefix: oldKey.keyPrefix,
          newKeyPrefix: newKey.keyPrefix,
        },
      },
    );

    return {
      ...newKey,
      previousKeyId: id,
    };
  }

  /**
   * Validate an API key and return org context
   * Used by the API key guard for authentication
   */
  async validateKey(plainKey: string): Promise<{
    id: string;
    orgId: string;
    createdBy: string;
    scopes: string[];
  } | null> {
    this.logger.debug('Validating API key');

    const keyHash = hashApiKey(plainKey);
    const key = await this.apiKeysRepository.findByKeyHash(keyHash);

    if (!key) {
      return null;
    }

    // Timing-safe comparison of the hash
    // This prevents timing attacks even if DB query timing varies
    try {
      const storedHashBuffer = Buffer.from(key.keyHash, 'hex');
      const computedHashBuffer = Buffer.from(keyHash, 'hex');

      if (storedHashBuffer.length !== computedHashBuffer.length ||
          !timingSafeEqual(storedHashBuffer, computedHashBuffer)) {
        this.logger.warn({ keyPrefix: key.keyPrefix }, 'API key hash mismatch');
        return null;
      }
    } catch (err) {
      // If buffers can't be compared (different lengths), key is invalid
      this.logger.warn({ keyPrefix: key.keyPrefix, error: err }, 'API key hash comparison failed');
      return null;
    }

    // Check if expired
    if (key.expiresAt && new Date(key.expiresAt) < new Date()) {
      this.logger.debug('API key has expired');
      return null;
    }

    // Update last used timestamp (async, non-blocking)
    this.apiKeysRepository.updateLastUsed(key.id).catch((err) => {
      this.logger.error('Failed to update last used timestamp', err);
    });

    return {
      id: key.id,
      orgId: key.orgId,
      createdBy: key.createdBy,
      scopes: key.scopes,
    };
  }

  /**
   * Maps an API key entity to an API key DTO
   */
  private toApiKeyDto(key: {
    id: string;
    name: string;
    keyPrefix: string;
    scopes: string[];
    lastUsedAt: Date | null;
    expiresAt: Date | null;
    revokedAt: Date | null;
    createdAt: Date;
  }): ApiKeyDto {
    return {
      id: key.id,
      name: key.name,
      keyPrefix: key.keyPrefix,
      scopes: key.scopes,
      lastUsedAt: key.lastUsedAt?.toISOString() || null,
      expiresAt: key.expiresAt?.toISOString() || null,
      revokedAt: key.revokedAt?.toISOString() || null,
      createdAt: key.createdAt.toISOString(),
      isRevoked: !!key.revokedAt,
    };
  }
}

