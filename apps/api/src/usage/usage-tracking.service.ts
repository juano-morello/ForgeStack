/**
 * Usage Tracking Service
 * Tracks API calls, storage changes, and seats using Redis counters
 * Fire-and-forget tracking that doesn't block requests
 */

import { Injectable, Logger } from '@nestjs/common';
import { QueueService } from '../queue/queue.service';
import IORedis from 'ioredis';
import { ConfigService } from '@nestjs/config';

export interface ApiCallData {
  endpoint: string;
  method: string;
  durationMs: number;
  timestamp: Date;
}

@Injectable()
export class UsageTrackingService {
  private readonly logger = new Logger(UsageTrackingService.name);
  private redis: IORedis;

  constructor(
    private queueService: QueueService,
    private configService: ConfigService,
  ) {
    const redisUrl = this.configService.get('REDIS_URL') || 'redis://localhost:6379';
    this.redis = new IORedis(redisUrl, { maxRetriesPerRequest: null });

    this.redis.on('error', (err) => {
      this.logger.warn(`Redis error in usage tracking: ${err.message}`);
    });
  }

  /**
   * Increment API call counter for org (stored in Redis)
   * Uses hourly buckets for aggregation
   */
  async trackApiCall(orgId: string, _data: ApiCallData): Promise<void> {
    const hourBucket = this.getHourBucket();
    const key = `usage:api_calls:${orgId}:${hourBucket}`;

    try {
      await this.redis
        .multi()
        .incr(key)
        .expire(key, 86400 * 7) // Expire after 7 days
        .exec();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn(`Failed to track API call: ${message}`);
      // Don't throw - fire-and-forget
    }
  }

  /**
   * Track storage change (increment/decrement)
   */
  async trackStorageChange(orgId: string, deltaBytes: number): Promise<void> {
    const key = `usage:storage:${orgId}`;

    try {
      await this.redis.incrby(key, deltaBytes);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn(`Failed to track storage: ${message}`);
      // Don't throw - fire-and-forget
    }
  }

  /**
   * Get current storage usage for org
   */
  async getStorageUsage(orgId: string): Promise<number> {
    try {
      const value = await this.redis.get(`usage:storage:${orgId}`);
      return parseInt(value || '0', 10);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn(`Failed to get storage usage: ${message}`);
      return 0;
    }
  }

  /**
   * Get API calls for a specific hour bucket
   */
  async getApiCallsForPeriod(orgId: string, hourBucket: string): Promise<number> {
    try {
      const key = `usage:api_calls:${orgId}:${hourBucket}`;
      const value = await this.redis.get(key);
      return parseInt(value || '0', 10);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn(`Failed to get API calls: ${message}`);
      return 0;
    }
  }

  /**
   * Get all API call keys for an org (for aggregation)
   */
  async getApiCallKeys(orgId: string, pattern?: string): Promise<string[]> {
    try {
      const searchPattern = pattern || `usage:api_calls:${orgId}:*`;
      return await this.redis.keys(searchPattern);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn(`Failed to get API call keys: ${message}`);
      return [];
    }
  }

  /**
   * Delete a Redis key (after aggregation)
   */
  async deleteKey(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn(`Failed to delete key ${key}: ${message}`);
    }
  }

  /**
   * Get hour bucket string for current time
   * Format: YYYY-MM-DD-HH
   */
  private getHourBucket(date: Date = new Date()): string {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    const hour = String(date.getUTCHours()).padStart(2, '0');
    return `${year}-${month}-${day}-${hour}`;
  }

  /**
   * Parse hour bucket string to Date
   */
  parseHourBucket(bucket: string): Date {
    const [year, month, day, hour] = bucket.split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day, hour, 0, 0, 0));
  }
}

