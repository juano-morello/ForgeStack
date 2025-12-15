/**
 * Impersonation Repository
 * Database operations for impersonation sessions (platform-level, not org-scoped)
 */

import { Injectable, Logger } from '@nestjs/common';
import {
  eq,
  and,
  isNull,
  gt,
  sql,
  withServiceContext,
  impersonationSessions,
  users,
  type ImpersonationSession,
  type NewImpersonationSession,
} from '@forgestack/db';

@Injectable()
export class ImpersonationRepository {
  private readonly logger = new Logger(ImpersonationRepository.name);

  /**
   * Create a new impersonation session
   */
  async create(data: NewImpersonationSession): Promise<ImpersonationSession> {
    this.logger.debug(`Creating impersonation session for actor ${data.actorId} -> target ${data.targetUserId}`);

    return withServiceContext('ImpersonationRepository.create', async (tx) => {
      const [session] = await tx
        .insert(impersonationSessions)
        .values(data)
        .returning();

      return session;
    });
  }

  /**
   * Find session by token hash
   * Note: The token column stores the SHA-256 hash of the actual token
   */
  async findByTokenHash(tokenHash: string): Promise<ImpersonationSession | null> {
    return withServiceContext('ImpersonationRepository.findByTokenHash', async (tx) => {
      const [session] = await tx
        .select()
        .from(impersonationSessions)
        .where(eq(impersonationSessions.token, tokenHash))
        .limit(1);

      return session || null;
    });
  }

  /**
   * Find active session by actor ID
   */
  async findActiveByActor(actorId: string): Promise<ImpersonationSession | null> {
    return withServiceContext('ImpersonationRepository.findActiveByActor', async (tx) => {
      const now = new Date();
      const [session] = await tx
        .select()
        .from(impersonationSessions)
        .where(
          and(
            eq(impersonationSessions.actorId, actorId),
            isNull(impersonationSessions.endedAt),
            gt(impersonationSessions.expiresAt, now)
          )
        )
        .limit(1);

      return session || null;
    });
  }

  /**
   * Find all active sessions
   */
  async findAllActive(): Promise<ImpersonationSession[]> {
    return withServiceContext('ImpersonationRepository.findAllActive', async (tx) => {
      const now = new Date();
      return tx
        .select()
        .from(impersonationSessions)
        .where(
          and(
            isNull(impersonationSessions.endedAt),
            gt(impersonationSessions.expiresAt, now)
          )
        );
    });
  }

  /**
   * End a session
   */
  async endSession(sessionId: string): Promise<ImpersonationSession | null> {
    this.logger.debug(`Ending impersonation session ${sessionId}`);

    return withServiceContext('ImpersonationRepository.endSession', async (tx) => {
      const [session] = await tx
        .update(impersonationSessions)
        .set({ endedAt: new Date() })
        .where(eq(impersonationSessions.id, sessionId))
        .returning();

      return session || null;
    });
  }

  /**
   * Increment action count for a session
   */
  async incrementActionCount(sessionId: string): Promise<void> {
    await withServiceContext('ImpersonationRepository.incrementActionCount', async (tx) => {
      await tx
        .update(impersonationSessions)
        .set({ actionsCount: sql`${impersonationSessions.actionsCount} + 1` })
        .where(eq(impersonationSessions.id, sessionId));
    });
  }

  /**
   * Find session by ID
   */
  async findById(sessionId: string): Promise<ImpersonationSession | null> {
    return withServiceContext('ImpersonationRepository.findById', async (tx) => {
      const [session] = await tx
        .select()
        .from(impersonationSessions)
        .where(eq(impersonationSessions.id, sessionId))
        .limit(1);

      return session || null;
    });
  }

  /**
   * Find user by ID (for getting actor/target user details)
   */
  async findUserById(userId: string): Promise<{
    id: string;
    email: string;
    name: string | null;
    isSuperAdmin: boolean;
    suspendedAt: Date | null;
  } | null> {
    return withServiceContext('ImpersonationRepository.findUserById', async (tx) => {
      const [user] = await tx
        .select({
          id: users.id,
          email: users.email,
          name: users.name,
          isSuperAdmin: users.isSuperAdmin,
          suspendedAt: users.suspendedAt,
        })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      return user || null;
    });
  }
}

