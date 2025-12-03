/**
 * @forgestack/api
 * NestJS API server entry point
 */

// IMPORTANT: Import OTEL SDK first for auto-instrumentation
import './telemetry/otel';

import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { json } from 'express';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './core/filters/http-exception.filter';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
    rawBody: true, // Enable raw body for webhook verification
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('port', 4000);
  const corsOrigin = configService.get<string>('corsOrigin', 'http://localhost:3000');

  // Cookie parser middleware (required for better-auth session tokens)
  app.use(cookieParser());

  // JSON body parser with raw body for webhooks
  app.use(
    json({
      verify: (req: { url?: string; rawBody?: Buffer }, res, buf) => {
        // Store raw body for webhook signature verification
        if (req.url === '/api/v1/billing/webhook' || req.url === '/api/v1/webhooks/stripe') {
          req.rawBody = buf;
        }
      },
    }),
  );

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // CORS configuration (credentials: true allows cookies to be sent)
  app.enableCors({
    origin: corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Org-Id', 'Cookie'],
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global exception filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // Swagger/OpenAPI configuration
  const swaggerConfig = new DocumentBuilder()
    .setTitle('ForgeStack API')
    .setDescription('Multi-tenant SaaS API for ForgeStack')
    .setVersion('1.0')
    .addBearerAuth()
    .addApiKey({ type: 'apiKey', name: 'X-Org-Id', in: 'header' }, 'X-Org-Id')
    .addServer('/api/v1')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);

  // Swagger UI at /api/docs
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  // OpenAPI JSON endpoint at /api/openapi.json
  app.getHttpAdapter().get('/api/openapi.json', (req, res) => {
    res.json(document);
  });

  await app.listen(port);
  logger.log(`🚀 ForgeStack API running on http://localhost:${port}/api/v1`);
  logger.log(`📚 API Documentation available at http://localhost:${port}/api/docs`);
}

bootstrap().catch((err) => {
  console.error('Failed to start application:', err);
  process.exit(1);
});

