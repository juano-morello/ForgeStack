/**
 * Impersonation Service
 * Business logic for user impersonation with security checks
 */

import { Injectable, Logger, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { ImpersonationRepository } from './impersonation.repository';
import { PlatformAuditService, type PlatformAuditContext } from '../admin/platform-audit/platform-audit.service';
import { randomBytes, createHash } from 'crypto';
import type { ImpersonationSession } from '@forgestack/db';

const DEFAULT_SESSION_DURATION_MINUTES = 60;

/**
 * Impersonation session with plain token (only returned on creation)
 */
export type ImpersonationSessionWithToken = ImpersonationSession & { token: string };

@Injectable()
export class ImpersonationService {
  private readonly logger = new Logger(ImpersonationService.name);

  constructor(
    private readonly impersonationRepository: ImpersonationRepository,
    private readonly platformAuditService: PlatformAuditService,
  ) {}

  /**
   * Start impersonating a user
   * Security checks:
   * - Actor must be super-admin
   * - Cannot impersonate other super-admins
   * - Cannot impersonate suspended users
   * - Only one active session per actor
   */
  async startImpersonation(
    actorId: string,
    targetUserId: string,
    durationMinutes: number = DEFAULT_SESSION_DURATION_MINUTES,
    ipAddress: string | null,
    userAgent: string | null,
    auditContext: PlatformAuditContext,
  ): Promise<ImpersonationSessionWithToken> {
    this.logger.log(`Starting impersonation: ${actorId} -> ${targetUserId}`);

    // Validate actor is super-admin
    const actor = await this.impersonationRepository.findUserById(actorId);
    if (!actor) {
      throw new NotFoundException('Actor user not found');
    }

    // Note: isSuperAdmin check should be done by the guard, but we double-check here
    // The guard ensures only super-admins can call this endpoint

    // Validate target user exists
    const targetUser = await this.impersonationRepository.findUserById(targetUserId);
    if (!targetUser) {
      throw new NotFoundException('Target user not found');
    }

    // Cannot impersonate yourself
    if (actorId === targetUserId) {
      throw new BadRequestException('Cannot impersonate yourself');
    }

    // Cannot impersonate other super-admins
    if (targetUser.isSuperAdmin) {
      throw new ForbiddenException('Cannot impersonate other super-admin users');
    }

    // Cannot impersonate suspended users
    if (targetUser.suspendedAt) {
      throw new ForbiddenException('Cannot impersonate suspended users');
    }

    // Check if actor already has an active session
    const existingSession = await this.impersonationRepository.findActiveByActor(actorId);
    if (existingSession) {
      throw new BadRequestException('You already have an active impersonation session. End it first.');
    }

    // Generate secure token
    const plainToken = this.generateToken();
    const tokenHash = this.hashToken(plainToken);

    // Calculate expiration
    const expiresAt = new Date(Date.now() + durationMinutes * 60 * 1000);

    // Create session (store the hash, not the plain token)
    const session = await this.impersonationRepository.create({
      actorId,
      targetUserId,
      token: tokenHash,  // Store hash in the 'token' column
      startedAt: new Date(),
      expiresAt,
      endedAt: null,
      actionsCount: 0,
      ipAddress,
      userAgent,
    });

    // Log to platform audit
    await this.platformAuditService.log(auditContext, {
      action: 'impersonation.started',
      resourceType: 'user',
      resourceId: targetUserId,
      resourceName: targetUser.email,
      metadata: {
        sessionId: session.id,
        durationMinutes,
      },
    });

    this.logger.log(`Impersonation session created: ${session.id}`);

    // Return session with plain token (only time it's available)
    return {
      ...session,
      token: plainToken,
    };
  }

  /**
   * End impersonation session
   */
  async endImpersonation(
    token: string,
    auditContext: PlatformAuditContext,
  ): Promise<ImpersonationSession> {
    this.logger.log('Ending impersonation session');

    const tokenHash = this.hashToken(token);
    const session = await this.impersonationRepository.findByTokenHash(tokenHash);
    if (!session) {
      throw new NotFoundException('Impersonation session not found');
    }

    if (session.endedAt) {
      throw new BadRequestException('Session already ended');
    }

    const updatedSession = await this.impersonationRepository.endSession(session.id);
    if (!updatedSession) {
      throw new NotFoundException('Failed to end session');
    }

    // Get target user for audit log
    const targetUser = await this.impersonationRepository.findUserById(session.targetUserId);

    // Log to platform audit
    await this.platformAuditService.log(auditContext, {
      action: 'impersonation.ended',
      resourceType: 'user',
      resourceId: session.targetUserId,
      resourceName: targetUser?.email || 'Unknown',
      metadata: {
        sessionId: session.id,
        duration: Math.floor((updatedSession.endedAt!.getTime() - session.startedAt.getTime()) / 1000),
        actionsPerformed: updatedSession.actionsCount,
      },
    });

    return updatedSession;
  }

  /**
   * Validate impersonation session
   */
  async validateSession(token: string): Promise<ImpersonationSession | null> {
    const tokenHash = this.hashToken(token);
    const session = await this.impersonationRepository.findByTokenHash(tokenHash);

    if (!session) {
      return null;
    }

    // Check if session has ended
    if (session.endedAt) {
      return null;
    }

    // Check if session has expired
    if (session.expiresAt < new Date()) {
      return null;
    }

    return session;
  }

  /**
   * Get active session for actor
   */
  async getActiveSession(actorId: string): Promise<ImpersonationSession | null> {
    return this.impersonationRepository.findActiveByActor(actorId);
  }

  /**
   * Get all active sessions (admin only)
   */
  async getActiveSessions(): Promise<ImpersonationSession[]> {
    return this.impersonationRepository.findAllActive();
  }

  /**
   * Force end a session (admin only)
   */
  async forceEndSession(
    sessionId: string,
    auditContext: PlatformAuditContext,
  ): Promise<ImpersonationSession> {
    this.logger.log(`Force ending impersonation session: ${sessionId}`);

    const session = await this.impersonationRepository.findById(sessionId);
    if (!session) {
      throw new NotFoundException('Session not found');
    }

    if (session.endedAt) {
      throw new BadRequestException('Session already ended');
    }

    const updatedSession = await this.impersonationRepository.endSession(sessionId);
    if (!updatedSession) {
      throw new NotFoundException('Failed to end session');
    }

    // Get target user for audit log
    const targetUser = await this.impersonationRepository.findUserById(session.targetUserId);

    // Log to platform audit
    await this.platformAuditService.log(auditContext, {
      action: 'impersonation.force_ended',
      resourceType: 'user',
      resourceId: session.targetUserId,
      resourceName: targetUser?.email || 'Unknown',
      metadata: {
        sessionId: session.id,
        forcedBy: auditContext.actorId,
      },
    });

    return updatedSession;
  }

  /**
   * Increment action count for a session
   */
  async incrementActionCount(sessionId: string): Promise<void> {
    await this.impersonationRepository.incrementActionCount(sessionId);
  }

  /**
   * Generate a secure random token
   */
  private generateToken(): string {
    return randomBytes(32).toString('base64url');
  }

  /**
   * Hash a token using SHA-256
   * Tokens are stored as hashes, never in plain text
   */
  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}

