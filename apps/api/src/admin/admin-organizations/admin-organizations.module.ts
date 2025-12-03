/**
 * Admin Organizations Module
 * Super-admin organization management functionality
 */

import { Module } from '@nestjs/common';
import { AdminOrganizationsController } from './admin-organizations.controller';
import { AdminOrganizationsService } from './admin-organizations.service';
import { AdminOrganizationsRepository } from './admin-organizations.repository';
import { PlatformAuditModule } from '../platform-audit/platform-audit.module';

@Module({
  imports: [PlatformAuditModule],
  controllers: [AdminOrganizationsController],
  providers: [AdminOrganizationsRepository, AdminOrganizationsService],
  exports: [AdminOrganizationsService, AdminOrganizationsRepository],
})
export class AdminOrganizationsModule {}

