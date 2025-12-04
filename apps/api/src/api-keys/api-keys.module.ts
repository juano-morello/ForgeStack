/**
 * API Keys Module
 * Provides API key management functionality
 */

import { Module } from '@nestjs/common';
import { ApiKeysController } from './api-keys.controller';
import { ApiKeysService } from './api-keys.service';
import { ApiKeysRepository } from './api-keys.repository';
import { ApiKeyGuard } from './api-key.guard';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';

@Module({
  imports: [AuditLogsModule],
  controllers: [ApiKeysController],
  providers: [ApiKeysService, ApiKeysRepository, ApiKeyGuard],
  exports: [ApiKeysService, ApiKeysRepository, ApiKeyGuard],
})
export class ApiKeysModule {}

