/**
 * Admin Users Module
 * Super-admin user management functionality
 */

import { Module } from '@nestjs/common';
import { AdminUsersController } from './admin-users.controller';
import { AdminUsersService } from './admin-users.service';
import { AdminUsersRepository } from './admin-users.repository';
import { PlatformAuditModule } from '../platform-audit/platform-audit.module';

@Module({
  imports: [PlatformAuditModule],
  controllers: [AdminUsersController],
  providers: [AdminUsersRepository, AdminUsersService],
  exports: [AdminUsersService, AdminUsersRepository],
})
export class AdminUsersModule {}

