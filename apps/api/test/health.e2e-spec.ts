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
});

