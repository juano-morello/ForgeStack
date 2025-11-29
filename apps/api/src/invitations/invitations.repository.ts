/**
 * Invitations Repository
 * Handles all database operations for invitations
 */

import { Injectable, Logger } from '@nestjs/common';
import {
  eq,
  and,
  gt,
  lt,
  count,
  withServiceContext,
  invitations,
  type Invitation,
  type OrgRole,
} from '@forgestack/db';

export interface PaginatedInvitations {
  items: Invitation[];
  total: number;
  page: number;
  limit: number;
}

export interface FindAllOptions {
  page?: number;
  limit?: number;
}

@Injectable()
export class InvitationsRepository {
  private readonly logger = new Logger(InvitationsRepository.name);

  /**
   * Create a new invitation
   */
  async create(
    orgId: string,
    email: string,
    role: OrgRole,
    token: string,
    expiresAt: Date,
  ): Promise<Invitation> {
    this.logger.debug(`Creating invitation for ${email} to org ${orgId}`);

    return withServiceContext('InvitationsRepository.create', async (tx) => {
      const [invitation] = await tx
        .insert(invitations)
        .values({
          orgId,
          email,
          role,
          token,
          expiresAt,
        })
        .returning();

      return invitation;
    });
  }

  /**
   * Find all pending (not expired) invitations for an organization with pagination
   */
  async findByOrgId(
    orgId: string,
    options: FindAllOptions = {},
  ): Promise<PaginatedInvitations> {
    const { page = 1, limit = 10 } = options;
    const offset = (page - 1) * limit;

    this.logger.debug(
      `Finding invitations for org ${orgId} (page: ${page}, limit: ${limit})`,
    );

    return withServiceContext('InvitationsRepository.findByOrgId', async (tx) => {
      const now = new Date();

      // Get items with pagination
      const items = await tx
        .select()
        .from(invitations)
        .where(and(eq(invitations.orgId, orgId), gt(invitations.expiresAt, now)))
        .limit(limit)
        .offset(offset);

      // Get total count
      const [countResult] = await tx
        .select({ count: count() })
        .from(invitations)
        .where(and(eq(invitations.orgId, orgId), gt(invitations.expiresAt, now)));

      const total = Number(countResult?.count ?? 0);

      return {
        items,
        total,
        page,
        limit,
      };
    });
  }

  /**
   * Find invitation by ID
   */
  async findById(id: string): Promise<Invitation | null> {
    this.logger.debug(`Finding invitation ${id}`);

    return withServiceContext('InvitationsRepository.findById', async (tx) => {
      const [invitation] = await tx
        .select()
        .from(invitations)
        .where(eq(invitations.id, id));
      return invitation || null;
    });
  }

  /**
   * Find invitation by token
   */
  async findByToken(token: string): Promise<Invitation | null> {
    this.logger.debug(`Finding invitation by token`);

    return withServiceContext('InvitationsRepository.findByToken', async (tx) => {
      const [invitation] = await tx
        .select()
        .from(invitations)
        .where(eq(invitations.token, token));
      return invitation || null;
    });
  }

  /**
   * Find invitation by email and organization
   */
  async findByEmailAndOrg(email: string, orgId: string): Promise<Invitation | null> {
    this.logger.debug(`Finding invitation for ${email} in org ${orgId}`);

    return withServiceContext(
      'InvitationsRepository.findByEmailAndOrg',
      async (tx) => {
        const now = new Date();
        const [invitation] = await tx
          .select()
          .from(invitations)
          .where(
            and(
              eq(invitations.email, email),
              eq(invitations.orgId, orgId),
              gt(invitations.expiresAt, now),
            ),
          );
        return invitation || null;
      },
    );
  }

  /**
   * Delete an invitation by ID
   */
  async delete(id: string): Promise<boolean> {
    this.logger.debug(`Deleting invitation ${id}`);

    return withServiceContext('InvitationsRepository.delete', async (tx) => {
      const result = await tx
        .delete(invitations)
        .where(eq(invitations.id, id))
        .returning();
      return result.length > 0;
    });
  }

  /**
   * Delete expired invitations (cleanup job)
   */
  async deleteExpired(): Promise<number> {
    this.logger.debug('Deleting expired invitations');

    return withServiceContext('InvitationsRepository.deleteExpired', async (tx) => {
      const now = new Date();
      const result = await tx
        .delete(invitations)
        .where(lt(invitations.expiresAt, now))
        .returning();
      return result.length;
    });
  }
}

