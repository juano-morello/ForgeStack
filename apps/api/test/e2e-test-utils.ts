/**
 * E2E Test Utilities
 * Helpers for E2E testing that require the full application
 * 
 * NOTE: This file imports AppModule and @forgestack/db.
 * Use test-utils.ts for unit tests to avoid database connections.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/core/filters/http-exception.filter';

// Import platform-express to ensure it's available
import '@nestjs/platform-express';

/**
 * Create a test NestJS application for E2E tests
 */
export async function createTestApp(): Promise<INestApplication> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  await app.init();
  return app;
}

