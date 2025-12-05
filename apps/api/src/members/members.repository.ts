/**
 * Members Repository
 * Handles all database operations for organization members
 */

import { Injectable, Logger } from '@nestjs/common';
import {
  eq,
  and,
  count,
  withServiceContext,
  users,
  organizationMembers,
  type OrgRole,
} from '@forgestack/db';

export interface MemberWithUser {
  userId: string;
  email: string;
  name: string | null;
  role: OrgRole;
  joinedAt: Date;
}

export interface PaginatedMembers {
  items: MemberWithUser[];
  total: number;
  page: number;
  limit: number;
}

export interface FindAllOptions {
  page?: number;
  limit?: number;
}

@Injectable()
export class MembersRepository {
  private readonly logger = new Logger(MembersRepository.name);

  /**
   * Find all members of an organization with user info
   */
  async findAllByOrgId(
    orgId: string,
    options: FindAllOptions = {},
  ): Promise<PaginatedMembers> {
    const { page = 1, limit = 10 } = options;
    const offset = (page - 1) * limit;

    this.logger.debug(
      `Finding all members for org ${orgId} (page: ${page}, limit: ${limit})`,
    );

    return withServiceContext('MembersRepository.findAllByOrgId', async (tx) => {
      // Get total count
      const [countResult] = await tx
        .select({ count: count() })
        .from(organizationMembers)
        .where(eq(organizationMembers.orgId, orgId));

      const total = countResult?.count || 0;

      // Get paginated members with user info
      const members = await tx
        .select({
          userId: organizationMembers.userId,
          role: organizationMembers.role,
          joinedAt: organizationMembers.joinedAt,
          email: users.email,
          name: users.name,
        })
        .from(organizationMembers)
        .innerJoin(users, eq(organizationMembers.userId, users.id))
        .where(eq(organizationMembers.orgId, orgId))
        .limit(limit)
        .offset(offset);

      return {
        items: members,
        total,
        page,
        limit,
      };
    });
  }

  /**
   * Find a specific member by user ID and org ID
   */
  async findByUserIdAndOrgId(
    userId: string,
    orgId: string,
  ): Promise<MemberWithUser | null> {
    this.logger.debug(`Finding member ${userId} in org ${orgId}`);

    return withServiceContext(
      'MembersRepository.findByUserIdAndOrgId',
      async (tx) => {
        const [member] = await tx
          .select({
            userId: organizationMembers.userId,
            role: organizationMembers.role,
            joinedAt: organizationMembers.joinedAt,
            email: users.email,
            name: users.name,
          })
          .from(organizationMembers)
          .innerJoin(users, eq(organizationMembers.userId, users.id))
          .where(
            and(
              eq(organizationMembers.userId, userId),
              eq(organizationMembers.orgId, orgId),
            ),
          )
          .limit(1);

        return member || null;
      },
    );
  }

  /**
   * Create a new member (used when accepting invitation)
   */
  async create(
    orgId: string,
    userId: string,
    role: OrgRole,
  ): Promise<void> {
    this.logger.debug(`Adding member ${userId} to org ${orgId} with role ${role}`);

    await withServiceContext('MembersRepository.create', async (tx) => {
      await tx.insert(organizationMembers).values({
        orgId,
        userId,
        role,
      });
    });
  }

  /**
   * Update a member's role
   */
  async updateRole(
    orgId: string,
    userId: string,
    role: OrgRole,
  ): Promise<void> {
    this.logger.debug(`Updating role for member ${userId} in org ${orgId} to ${role}`);

    await withServiceContext('MembersRepository.updateRole', async (tx) => {
      await tx
        .update(organizationMembers)
        .set({ role })
        .where(
          and(
            eq(organizationMembers.orgId, orgId),
            eq(organizationMembers.userId, userId),
          ),
        );
    });
  }

  /**
   * Delete a member from an organization
   */
  async delete(orgId: string, userId: string): Promise<void> {
    this.logger.debug(`Removing member ${userId} from org ${orgId}`);

    await withServiceContext('MembersRepository.delete', async (tx) => {
      await tx
        .delete(organizationMembers)
        .where(
          and(
            eq(organizationMembers.orgId, orgId),
            eq(organizationMembers.userId, userId),
          ),
        );
    });
  }

  /**
   * Count the number of OWNER members in an organization
   */
  async countOwners(orgId: string): Promise<number> {
    this.logger.debug(`Counting owners for org ${orgId}`);

    return withServiceContext('MembersRepository.countOwners', async (tx) => {
      const [result] = await tx
        .select({ count: count() })
        .from(organizationMembers)
        .where(
          and(
            eq(organizationMembers.orgId, orgId),
            eq(organizationMembers.role, 'OWNER'),
          ),
        );

      return result?.count || 0;
    });
  }

  /**
   * Count all members in an organization
   */
  async count(orgId: string): Promise<number> {
    this.logger.debug(`Counting all members for org ${orgId}`);

    return withServiceContext('MembersRepository.count', async (tx) => {
      const [result] = await tx
        .select({ count: count() })
        .from(organizationMembers)
        .where(eq(organizationMembers.orgId, orgId));

      return result?.count || 0;
    });
  }
}

