/**
 * OpenAPI Specification Generator
 * Generates openapi.json file from NestJS application
 */

import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { writeFileSync } from 'fs';
import { join } from 'path';
import { AppModule } from '../src/app.module';

async function generateOpenApiSpec() {
  console.log('🚀 Starting OpenAPI spec generation...');

  // Create NestJS application
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn'], // Reduce noise during generation
  });

  // Set global prefix to match runtime config
  app.setGlobalPrefix('api/v1');

  // Configure Swagger
  const swaggerConfig = new DocumentBuilder()
    .setTitle('ForgeStack API')
    .setDescription('Multi-tenant SaaS API for ForgeStack')
    .setVersion('1.0')
    .addBearerAuth()
    .addApiKey({ type: 'apiKey', name: 'X-Org-Id', in: 'header' }, 'X-Org-Id')
    .addServer('/api/v1', 'API Server')
    .build();

  // Generate OpenAPI document
  const document = SwaggerModule.createDocument(app, swaggerConfig);

  // Write to file
  const outputPath = join(__dirname, '..', 'openapi.json');
  writeFileSync(outputPath, JSON.stringify(document, null, 2));

  console.log(`✅ OpenAPI spec generated: ${outputPath}`);
  console.log(`📊 Total endpoints: ${Object.keys(document.paths || {}).length}`);

  await app.close();
  process.exit(0);
}

generateOpenApiSpec().catch((error) => {
  console.error('❌ Failed to generate OpenAPI spec:', error);
  process.exit(1);
});

