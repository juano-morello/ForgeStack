/**
 * Queue E2E Tests
 * Tests for queue/background job endpoints
 */

import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from './e2e-test-utils';

describe('Queue (E2E)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/v1/queue/test-welcome-email', () => {
    it('should return jobId with valid data', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/queue/test-welcome-email')
        .send({
          userId: '123e4567-e89b-12d3-a456-426614174000',
          email: 'test@example.com',
        })
        .expect(201);

      expect(response.body).toBeDefined();
      expect(response.body.jobId).toBeDefined();
      expect(response.body.status).toBe('queued');
      expect(typeof response.body.jobId).toBe('string');
    });

    it('should accept request with both userId and email', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/queue/test-welcome-email')
        .send({
          userId: '123e4567-e89b-12d3-a456-426614174000',
          email: 'another@example.com',
        })
        .expect(201);

      expect(response.body.jobId).toBeDefined();
      expect(response.body.status).toBe('queued');
    });

    it('should have correct success response shape', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/queue/test-welcome-email')
        .send({
          userId: '123e4567-e89b-12d3-a456-426614174000',
          email: 'test@example.com',
        })
        .expect(201);

      expect(response.body).toEqual({
        jobId: expect.any(String),
        status: 'queued',
      });
    });
  });
});

