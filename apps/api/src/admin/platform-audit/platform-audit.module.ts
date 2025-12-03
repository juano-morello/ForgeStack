/**
 * Platform Audit Module
 * Platform-level audit logging for super-admin actions
 */

import { Module } from '@nestjs/common';
import { PlatformAuditService } from './platform-audit.service';
import { PlatformAuditRepository } from './platform-audit.repository';

@Module({
  providers: [PlatformAuditService, PlatformAuditRepository],
  exports: [PlatformAuditService, PlatformAuditRepository],
})
export class PlatformAuditModule {}

