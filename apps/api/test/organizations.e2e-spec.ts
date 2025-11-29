/**
 * Organizations E2E Tests
 * Tests for organization management endpoints
 */

import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from './e2e-test-utils';

describe('Organizations (E2E)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/v1/organizations', () => {
    it('should return 401 without authentication', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/organizations')
        .expect(401);

      expect(response.body).toBeDefined();
      expect(response.body.statusCode).toBe(401);
      expect(response.body.message).toContain('Authentication required');
    });

    it('should return 401 with invalid session token', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/organizations')
        .set('Cookie', ['better-auth.session_token=invalid-token'])
        .expect(401);

      expect(response.body.statusCode).toBe(401);
    });

    it('should have correct error response shape', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/organizations')
        .expect(401);

      expect(response.body).toMatchObject({
        statusCode: 401,
        message: expect.any(String),
        error: expect.any(String),
        timestamp: expect.any(String),
        path: '/api/v1/organizations',
      });
    });
  });

  describe('POST /api/v1/organizations', () => {
    it('should return 401 without authentication', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/organizations')
        .send({ name: 'Test Organization' })
        .expect(401);

      expect(response.body.statusCode).toBe(401);
      expect(response.body.message).toContain('Authentication required');
    });

    it('should return 401 with invalid session token', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/organizations')
        .set('Cookie', ['better-auth.session_token=invalid-token'])
        .send({ name: 'Test Organization' })
        .expect(401);

      expect(response.body.statusCode).toBe(401);
    });

    it('should have correct error response shape', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/organizations')
        .send({ name: 'Test Organization' })
        .expect(401);

      expect(response.body).toMatchObject({
        statusCode: 401,
        message: expect.any(String),
        error: expect.any(String),
        timestamp: expect.any(String),
        path: '/api/v1/organizations',
      });
    });
  });

  describe('GET /api/v1/organizations/:id', () => {
    const testOrgId = '123e4567-e89b-12d3-a456-426614174000';

    it('should return 401 without authentication', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/organizations/${testOrgId}`)
        .expect(401);

      expect(response.body.statusCode).toBe(401);
    });

    it('should return 401 with invalid session token', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/organizations/${testOrgId}`)
        .set('Cookie', ['better-auth.session_token=invalid-token'])
        .expect(401);

      expect(response.body.statusCode).toBe(401);
    });
  });

  describe('PATCH /api/v1/organizations/:id', () => {
    const testOrgId = '123e4567-e89b-12d3-a456-426614174000';

    it('should return 401 without authentication', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/v1/organizations/${testOrgId}`)
        .send({ name: 'Updated Name' })
        .expect(401);

      expect(response.body.statusCode).toBe(401);
    });
  });

  describe('DELETE /api/v1/organizations/:id', () => {
    const testOrgId = '123e4567-e89b-12d3-a456-426614174000';

    it('should return 401 without authentication', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/api/v1/organizations/${testOrgId}`)
        .expect(401);

      expect(response.body.statusCode).toBe(401);
    });
  });
});

