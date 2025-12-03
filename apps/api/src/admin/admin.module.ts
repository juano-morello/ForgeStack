/**
 * Admin Module
 * Super-admin platform management functionality
 * 
 * This module provides platform-level administration features:
 * - User management (suspend, unsuspend, delete)
 * - Organization management (suspend, unsuspend, delete, transfer ownership)
 * - Platform audit logging
 * 
 * All endpoints require super-admin access via @RequireSuperAdmin() decorator
 */

import { Module } from '@nestjs/common';
import { AdminUsersModule } from './admin-users/admin-users.module';
import { AdminOrganizationsModule } from './admin-organizations/admin-organizations.module';
import { PlatformAuditModule } from './platform-audit/platform-audit.module';

@Module({
  imports: [
    PlatformAuditModule,
    AdminUsersModule,
    AdminOrganizationsModule,
  ],
  exports: [
    PlatformAuditModule,
    AdminUsersModule,
    AdminOrganizationsModule,
  ],
})
export class AdminModule {}

