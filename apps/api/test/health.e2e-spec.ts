/**
 * Health E2E Tests
 * Tests for the health check endpoint
 */

import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from './e2e-test-utils';

describe('Health (E2E)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/v1/health', () => {
    it('should return 200 OK', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/health')
        .expect(200);

      expect(response.body).toBeDefined();
    });

    it('should return status: ok', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/health')
        .expect(200);

      expect(response.body.status).toBe('ok');
    });

    it('should return a timestamp', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/health')
        .expect(200);

      expect(response.body.timestamp).toBeDefined();
      expect(typeof response.body.timestamp).toBe('string');

      // Verify it's a valid ISO timestamp
      const timestamp = new Date(response.body.timestamp);
      expect(timestamp.toString()).not.toBe('Invalid Date');
    });

    it('should have correct response shape', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/health')
        .expect(200);

      expect(response.body).toEqual({
        status: 'ok',
        timestamp: expect.any(String),
      });
    });
  });

  describe('GET /api/v1/health/ready', () => {
    it('should check all dependencies', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/health/ready');

      expect(response.body).toBeDefined();
      expect(response.body.status).toBeDefined();
      expect(['healthy', 'unhealthy']).toContain(response.body.status);
    });

    it('should return correct response shape', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/health/ready');

      expect(response.body).toEqual({
        status: expect.stringMatching(/^(healthy|unhealthy)$/),
        timestamp: expect.any(String),
        checks: {
          database: expect.objectContaining({
            status: expect.stringMatching(/^(up|down)$/),
          }),
          redis: expect.objectContaining({
            status: expect.stringMatching(/^(up|down)$/),
          }),
        },
      });
    });

    it('should verify database connectivity', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/health/ready');

      expect(response.body.checks.database.status).toBeDefined();
      expect(['up', 'down']).toContain(response.body.checks.database.status);

      if (response.body.checks.database.status === 'up') {
        expect(response.body.checks.database.latencyMs).toBeGreaterThanOrEqual(0);
      } else {
        expect(response.body.checks.database.error).toBeDefined();
      }
    });

    it('should verify Redis connectivity', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/health/ready');

      expect(response.body.checks.redis.status).toBeDefined();
      expect(['up', 'down']).toContain(response.body.checks.redis.status);

      if (response.body.checks.redis.status === 'up') {
        expect(response.body.checks.redis.latencyMs).toBeGreaterThanOrEqual(0);
      } else {
        expect(response.body.checks.redis.error).toBeDefined();
      }
    });

    it('should return a valid ISO timestamp', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/health/ready');

      expect(response.body.timestamp).toBeDefined();
      expect(typeof response.body.timestamp).toBe('string');

      // Verify it's a valid ISO timestamp
      const timestamp = new Date(response.body.timestamp);
      expect(timestamp.toString()).not.toBe('Invalid Date');
    });

    it('should return 503 when any dependency is down', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/health/ready');

      if (response.status === 503) {
        expect(response.body.status).toBe('unhealthy');
        const checks = response.body.checks;
        const hasDownDependency =
          checks.database.status === 'down' ||
          checks.redis.status === 'down';
        expect(hasDownDependency).toBe(true);
      } else {
        expect(response.status).toBe(200);
        expect(response.body.status).toBe('healthy');
      }
    });

    it('should include latency metrics for healthy dependencies', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/health/ready');

      if (response.body.checks.database.status === 'up') {
        expect(response.body.checks.database.latencyMs).toBeDefined();
        expect(typeof response.body.checks.database.latencyMs).toBe('number');
      }

      if (response.body.checks.redis.status === 'up') {
        expect(response.body.checks.redis.latencyMs).toBeDefined();
        expect(typeof response.body.checks.redis.latencyMs).toBe('number');
      }
    });
  });
});

