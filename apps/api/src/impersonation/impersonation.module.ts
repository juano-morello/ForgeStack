/**
 * Impersonation Module
 * Handles user impersonation for super-admins
 */

import { Module } from '@nestjs/common';
import { ImpersonationController } from './impersonation.controller';
import { ImpersonationService } from './impersonation.service';
import { ImpersonationRepository } from './impersonation.repository';
import { PlatformAuditModule } from '../admin/platform-audit/platform-audit.module';

@Module({
  imports: [PlatformAuditModule],
  controllers: [ImpersonationController],
  providers: [ImpersonationService, ImpersonationRepository],
  exports: [ImpersonationService, ImpersonationRepository],
})
export class ImpersonationModule {}

