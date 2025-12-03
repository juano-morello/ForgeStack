/**
 * Platform Audit Service
 * Handles logging of all super-admin actions to platform_audit_logs
 */

import { Injectable, Logger } from '@nestjs/common';
import { PlatformAuditRepository } from './platform-audit.repository';

/**
 * Platform audit event data structure
 */
export interface PlatformAuditEventData {
  action: string;
  resourceType: string;
  resourceId?: string;
  resourceName?: string;
  targetOrgId?: string;
  targetOrgName?: string;
  changes?: {
    before?: Record<string, unknown>;
    after?: Record<string, unknown>;
  };
  metadata?: Record<string, unknown>;
}

/**
 * Platform audit context (super-admin actor)
 */
export interface PlatformAuditContext {
  actorId: string;
  actorEmail: string;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class PlatformAuditService {
  private readonly logger = new Logger(PlatformAuditService.name);

  constructor(private readonly platformAuditRepository: PlatformAuditRepository) {}

  /**
   * Log a platform-level audit event
   * This is synchronous and should complete before the action is confirmed
   * IMPORTANT: This method never throws - logging failures should not affect main operations
   */
  async log(context: PlatformAuditContext, event: PlatformAuditEventData): Promise<void> {
    try {
      await this.platformAuditRepository.create({
        actorId: context.actorId,
        actorEmail: context.actorEmail,
        action: event.action,
        resourceType: event.resourceType,
        resourceId: event.resourceId || null,
        resourceName: event.resourceName || null,
        targetOrgId: event.targetOrgId || null,
        targetOrgName: event.targetOrgName || null,
        changes: event.changes || null,
        metadata: event.metadata || null,
        ipAddress: context.ipAddress || null,
        userAgent: context.userAgent || null,
      });

      this.logger.log(
        `Platform audit: ${context.actorEmail} performed ${event.action} on ${event.resourceType}${event.resourceId ? ` (${event.resourceId})` : ''}`,
      );
    } catch (error) {
      // Log error but don't throw - audit logging should never break operations
      this.logger.error('Failed to create platform audit log', {
        error: error instanceof Error ? error.message : 'Unknown error',
        context,
        event,
      });
    }
  }

  /**
   * Helper method to log user suspension
   */
  async logUserSuspension(
    context: PlatformAuditContext,
    userId: string,
    userEmail: string,
    reason: string,
  ): Promise<void> {
    await this.log(context, {
      action: 'user.suspended',
      resourceType: 'user',
      resourceId: userId,
      resourceName: userEmail,
      metadata: { reason },
    });
  }

  /**
   * Helper method to log user unsuspension
   */
  async logUserUnsuspension(
    context: PlatformAuditContext,
    userId: string,
    userEmail: string,
  ): Promise<void> {
    await this.log(context, {
      action: 'user.unsuspended',
      resourceType: 'user',
      resourceId: userId,
      resourceName: userEmail,
    });
  }

  /**
   * Helper method to log organization suspension
   */
  async logOrgSuspension(
    context: PlatformAuditContext,
    orgId: string,
    orgName: string,
    reason: string,
  ): Promise<void> {
    await this.log(context, {
      action: 'organization.suspended',
      resourceType: 'organization',
      resourceId: orgId,
      resourceName: orgName,
      targetOrgId: orgId,
      targetOrgName: orgName,
      metadata: { reason },
    });
  }

  /**
   * Helper method to log organization unsuspension
   */
  async logOrgUnsuspension(
    context: PlatformAuditContext,
    orgId: string,
    orgName: string,
  ): Promise<void> {
    await this.log(context, {
      action: 'organization.unsuspended',
      resourceType: 'organization',
      resourceId: orgId,
      resourceName: orgName,
      targetOrgId: orgId,
      targetOrgName: orgName,
    });
  }

  /**
   * Helper method to log feature flag changes
   */
  async logFeatureFlagChange(
    context: PlatformAuditContext,
    flagId: string,
    flagKey: string,
    changes: { before?: Record<string, unknown>; after?: Record<string, unknown> },
  ): Promise<void> {
    await this.log(context, {
      action: 'feature_flag.updated',
      resourceType: 'feature_flag',
      resourceId: flagId,
      resourceName: flagKey,
      changes,
    });
  }
}

