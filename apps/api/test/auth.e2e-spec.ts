/**
 * Auth E2E Tests
 * Tests for authentication endpoints
 */

import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from './e2e-test-utils';

describe('Auth (E2E)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/v1/auth/me', () => {
    it('should return 401 without authentication', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .expect(401);

      expect(response.body).toBeDefined();
      expect(response.body.statusCode).toBe(401);
      expect(response.body.message).toBeDefined();
    });

    it('should return 401 with invalid session token in cookie', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Cookie', ['better-auth.session_token=invalid-token'])
        .expect(401);

      expect(response.body.statusCode).toBe(401);
      // Message can be either "No session token provided" or "Invalid or expired session"
      // depending on cookie parsing
      expect(response.body.message).toBeDefined();
    });

    it('should return 401 with invalid session token in Authorization header', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.statusCode).toBe(401);
      expect(response.body.message).toContain('Invalid or expired session');
    });

    it('should return 401 with malformed Authorization header', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', 'InvalidFormat')
        .expect(401);

      expect(response.body.statusCode).toBe(401);
    });

    it('should have correct error response shape', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .expect(401);

      expect(response.body).toMatchObject({
        statusCode: 401,
        message: expect.any(String),
        error: expect.any(String),
        timestamp: expect.any(String),
        path: expect.any(String),
      });
    });
  });
});

