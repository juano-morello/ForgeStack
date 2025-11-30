/**
 * Audit Logs Module
 * Provides audit logging functionality for the application
 */

import { Module, forwardRef } from '@nestjs/common';
import { AuditLogsController } from './audit-logs.controller';
import { AuditLogsService } from './audit-logs.service';
import { AuditLogsRepository } from './audit-logs.repository';
import { QueueModule } from '../queue/queue.module';
import { BillingModule } from '../billing/billing.module';

@Module({
  imports: [QueueModule, forwardRef(() => BillingModule)],
  controllers: [AuditLogsController],
  providers: [AuditLogsService, AuditLogsRepository],
  exports: [AuditLogsService],
})
export class AuditLogsModule {}

