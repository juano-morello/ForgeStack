/**
 * Admin Users Service
 * Business logic for super-admin user management
 */

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { AdminUsersRepository, type FindAllUsersOptions } from './admin-users.repository';
import { PlatformAuditService, type PlatformAuditContext } from '../platform-audit/platform-audit.service';

@Injectable()
export class AdminUsersService {
  private readonly logger = new Logger(AdminUsersService.name);

  constructor(
    private readonly adminUsersRepository: AdminUsersRepository,
    private readonly platformAuditService: PlatformAuditService,
  ) {}

  /**
   * List all users with pagination and search
   */
  async findAll(options: FindAllUsersOptions) {
    this.logger.debug('Listing all users');
    return this.adminUsersRepository.findAll(options);
  }

  /**
   * Get user details by ID
   */
  async findById(id: string) {
    this.logger.debug(`Finding user ${id}`);
    const user = await this.adminUsersRepository.findById(id);
    
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  /**
   * Suspend a user account
   */
  async suspend(
    id: string,
    reason: string,
    auditContext: PlatformAuditContext,
  ) {
    this.logger.log(`Suspending user ${id}`);

    const user = await this.findById(id);

    if (user.suspendedAt) {
      throw new Error('User is already suspended');
    }

    const updatedUser = await this.adminUsersRepository.suspend(
      id,
      reason,
      auditContext.actorId,
    );

    // Log to platform audit
    await this.platformAuditService.logUserSuspension(
      auditContext,
      id,
      user.email,
      reason,
    );

    return updatedUser;
  }

  /**
   * Unsuspend a user account
   */
  async unsuspend(
    id: string,
    auditContext: PlatformAuditContext,
  ) {
    this.logger.log(`Unsuspending user ${id}`);

    const user = await this.findById(id);

    if (!user.suspendedAt) {
      throw new Error('User is not suspended');
    }

    const updatedUser = await this.adminUsersRepository.unsuspend(id);

    // Log to platform audit
    await this.platformAuditService.logUserUnsuspension(
      auditContext,
      id,
      user.email,
    );

    return updatedUser;
  }

  /**
   * Delete a user account
   */
  async delete(
    id: string,
    auditContext: PlatformAuditContext,
  ) {
    this.logger.log(`Deleting user ${id}`);

    const user = await this.findById(id);

    // Prevent deleting super-admins
    if (user.isSuperAdmin) {
      throw new Error('Cannot delete super-admin users');
    }

    await this.adminUsersRepository.delete(id);

    // Log to platform audit
    await this.platformAuditService.log(auditContext, {
      action: 'user.deleted',
      resourceType: 'user',
      resourceId: id,
      resourceName: user.email,
    });
  }
}

