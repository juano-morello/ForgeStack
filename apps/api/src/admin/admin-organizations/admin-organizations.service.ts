/**
 * Admin Organizations Service
 * Business logic for super-admin organization management
 */

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { AdminOrganizationsRepository, type FindAllOrganizationsOptions } from './admin-organizations.repository';
import { PlatformAuditService, type PlatformAuditContext } from '../platform-audit/platform-audit.service';

@Injectable()
export class AdminOrganizationsService {
  private readonly logger = new Logger(AdminOrganizationsService.name);

  constructor(
    private readonly adminOrganizationsRepository: AdminOrganizationsRepository,
    private readonly platformAuditService: PlatformAuditService,
  ) {}

  /**
   * List all organizations with pagination and search
   */
  async findAll(options: FindAllOrganizationsOptions) {
    this.logger.debug('Listing all organizations');
    return this.adminOrganizationsRepository.findAll(options);
  }

  /**
   * Get organization details by ID
   */
  async findById(id: string) {
    this.logger.debug(`Finding organization ${id}`);
    const org = await this.adminOrganizationsRepository.findById(id);
    
    if (!org) {
      throw new NotFoundException('Organization not found');
    }

    return org;
  }

  /**
   * Suspend an organization
   */
  async suspend(
    id: string,
    reason: string,
    auditContext: PlatformAuditContext,
  ) {
    this.logger.log(`Suspending organization ${id}`);

    const org = await this.findById(id);

    if (org.suspendedAt) {
      throw new Error('Organization is already suspended');
    }

    const updatedOrg = await this.adminOrganizationsRepository.suspend(
      id,
      reason,
      auditContext.actorId,
    );

    // Log to platform audit
    await this.platformAuditService.logOrgSuspension(
      auditContext,
      id,
      org.name,
      reason,
    );

    return updatedOrg;
  }

  /**
   * Unsuspend an organization
   */
  async unsuspend(
    id: string,
    auditContext: PlatformAuditContext,
  ) {
    this.logger.log(`Unsuspending organization ${id}`);

    const org = await this.findById(id);

    if (!org.suspendedAt) {
      throw new Error('Organization is not suspended');
    }

    const updatedOrg = await this.adminOrganizationsRepository.unsuspend(id);

    // Log to platform audit
    await this.platformAuditService.logOrgUnsuspension(
      auditContext,
      id,
      org.name,
    );

    return updatedOrg;
  }

  /**
   * Delete an organization
   */
  async delete(
    id: string,
    auditContext: PlatformAuditContext,
  ) {
    this.logger.log(`Deleting organization ${id}`);

    const org = await this.findById(id);

    await this.adminOrganizationsRepository.delete(id);

    // Log to platform audit
    await this.platformAuditService.log(auditContext, {
      action: 'organization.deleted',
      resourceType: 'organization',
      resourceId: id,
      resourceName: org.name,
      targetOrgId: id,
      targetOrgName: org.name,
    });
  }

  /**
   * Transfer organization ownership
   */
  async transferOwnership(
    id: string,
    newOwnerId: string,
    auditContext: PlatformAuditContext,
  ) {
    this.logger.log(`Transferring ownership of organization ${id} to user ${newOwnerId}`);

    const org = await this.findById(id);
    const oldOwnerId = org.ownerUserId;

    const updatedOrg = await this.adminOrganizationsRepository.transferOwnership(id, newOwnerId);

    // Log to platform audit
    await this.platformAuditService.log(auditContext, {
      action: 'organization.ownership_transferred',
      resourceType: 'organization',
      resourceId: id,
      resourceName: org.name,
      targetOrgId: id,
      targetOrgName: org.name,
      changes: {
        before: { ownerUserId: oldOwnerId },
        after: { ownerUserId: newOwnerId },
      },
    });

    return updatedOrg;
  }
}

