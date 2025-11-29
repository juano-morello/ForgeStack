/**
 * Projects E2E Tests
 * Tests for project management endpoints
 */

import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from './e2e-test-utils';

describe('Projects (E2E)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/v1/projects', () => {
    it('should return 401 without authentication', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/projects')
        .expect(401);

      expect(response.body).toBeDefined();
      expect(response.body.statusCode).toBe(401);
      expect(response.body.message).toContain('Authentication required');
    });

    it('should return 401 with invalid session token', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/projects')
        .set('Cookie', ['better-auth.session_token=invalid-token'])
        .expect(401);

      expect(response.body.statusCode).toBe(401);
    });

    it('should have correct error response shape', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/projects')
        .expect(401);

      expect(response.body).toMatchObject({
        statusCode: 401,
        message: expect.any(String),
        error: expect.any(String),
        timestamp: expect.any(String),
        path: '/api/v1/projects',
      });
    });
  });

  describe('POST /api/v1/projects', () => {
    it('should return 401 without authentication', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/projects')
        .send({ 
          name: 'Test Project',
          description: 'Test project description'
        })
        .expect(401);

      expect(response.body.statusCode).toBe(401);
      expect(response.body.message).toContain('Authentication required');
    });

    it('should return 401 with invalid session token', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/projects')
        .set('Cookie', ['better-auth.session_token=invalid-token'])
        .send({ 
          name: 'Test Project',
          description: 'Test project description'
        })
        .expect(401);

      expect(response.body.statusCode).toBe(401);
    });

    it('should have correct error response shape', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/projects')
        .send({ 
          name: 'Test Project',
          description: 'Test project description'
        })
        .expect(401);

      expect(response.body).toMatchObject({
        statusCode: 401,
        message: expect.any(String),
        error: expect.any(String),
        timestamp: expect.any(String),
        path: '/api/v1/projects',
      });
    });
  });

  describe('GET /api/v1/projects/:id', () => {
    const testProjectId = '123e4567-e89b-12d3-a456-426614174000';

    it('should return 401 without authentication', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/projects/${testProjectId}`)
        .expect(401);

      expect(response.body.statusCode).toBe(401);
    });

    it('should return 401 with invalid session token', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/projects/${testProjectId}`)
        .set('Cookie', ['better-auth.session_token=invalid-token'])
        .expect(401);

      expect(response.body.statusCode).toBe(401);
    });
  });

  describe('PATCH /api/v1/projects/:id', () => {
    const testProjectId = '123e4567-e89b-12d3-a456-426614174000';

    it('should return 401 without authentication', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/v1/projects/${testProjectId}`)
        .send({ name: 'Updated Name' })
        .expect(401);

      expect(response.body.statusCode).toBe(401);
    });
  });

  describe('DELETE /api/v1/projects/:id', () => {
    const testProjectId = '123e4567-e89b-12d3-a456-426614174000';

    it('should return 401 without authentication', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/api/v1/projects/${testProjectId}`)
        .expect(401);

      expect(response.body.statusCode).toBe(401);
    });
  });
});

