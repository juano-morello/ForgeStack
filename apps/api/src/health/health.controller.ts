/**
 * Health check controller
 * Returns API health status
 */

import { Controller, Get, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { pool } from '@forgestack/db';
import { Public } from '../core/decorators/public.decorator';

interface HealthResponse {
  status: string;
  timestamp: string;
}

interface ReadinessResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  checks: {
    database: { status: 'up' | 'down'; latencyMs?: number; error?: string };
    redis: { status: 'up' | 'down'; latencyMs?: number; error?: string };
  };
}

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly configService: ConfigService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Health check', description: 'Returns API health status' })
  @ApiResponse({ status: 200, description: 'API is healthy', schema: { example: { status: 'ok', timestamp: '2024-01-01T00:00:00.000Z' } } })
  check(): HealthResponse {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('ready')
  @Public()
  @ApiOperation({ summary: 'Readiness check', description: 'Verifies all dependencies are healthy' })
  @ApiResponse({ status: 200, description: 'All dependencies healthy' })
  @ApiResponse({ status: 503, description: 'One or more dependencies unhealthy' })
  async checkReady(): Promise<ReadinessResponse> {
    const checks = {
      database: await this.checkDatabase(),
      redis: await this.checkRedis(),
    };

    const allHealthy = Object.values(checks).every((c) => c.status === 'up');

    const response: ReadinessResponse = {
      status: allHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      checks,
    };

    if (!allHealthy) {
      throw new HttpException(response, HttpStatus.SERVICE_UNAVAILABLE);
    }

    return response;
  }

  private async checkDatabase(): Promise<{
    status: 'up' | 'down';
    latencyMs?: number;
    error?: string;
  }> {
    const start = Date.now();
    try {
      const client = await pool.connect();
      await client.query('SELECT 1');
      client.release();
      return { status: 'up', latencyMs: Date.now() - start };
    } catch (error) {
      return {
        status: 'down',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async checkRedis(): Promise<{
    status: 'up' | 'down';
    latencyMs?: number;
    error?: string;
  }> {
    const redisUrl = this.configService.get<string>('redis.url');
    if (!redisUrl) {
      return { status: 'down', error: 'Redis not configured' };
    }

    const start = Date.now();
    let redis: Redis | null = null;
    try {
      redis = new Redis(redisUrl, {
        enableOfflineQueue: false,
        connectTimeout: 5000,
        maxRetriesPerRequest: 1,
      });
      await redis.ping();
      return { status: 'up', latencyMs: Date.now() - start };
    } catch (error) {
      return {
        status: 'down',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    } finally {
      if (redis) {
        redis.disconnect();
      }
    }
  }
}

