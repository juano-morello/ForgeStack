/**
 * Organizations Repository
 * Handles all database operations for organizations
 */

import { Injectable, Logger } from '@nestjs/common';
import {
  eq,
  and,
  inArray,
  withServiceContext,
  withTenantContext,
  organizations,
  organizationMembers,
  type TenantContext,
  type Organization,
  type NewOrganization,
} from '@forgestack/db';
import type { OrgRole, PaginatedResponse } from '@forgestack/shared';

export interface OrganizationWithRole extends Organization {
  role?: OrgRole;
}

export interface PaginatedOrganizations {
  items: OrganizationWithRole[];
  total: number;
  page: number;
  limit: number;
}

export interface FindAllOptions {
  page?: number;
  limit?: number;
}

export interface MembershipResult {
  role: OrgRole;
}

@Injectable()
export class OrganizationsRepository {
  private readonly logger = new Logger(OrganizationsRepository.name);

  /**
   * Create a new organization with the creator as OWNER member
   */
  async create(
    userId: string,
    data: Pick<NewOrganization, 'name'>,
  ): Promise<Organization> {
    this.logger.debug(`Creating organization "${data.name}" for user ${userId}`);

    return withServiceContext('OrganizationsRepository.create', async (tx) => {
      // Create the organization
      const [org] = await tx
        .insert(organizations)
        .values({
          name: data.name,
          ownerUserId: userId,
        })
        .returning();

      // Add the creator as an OWNER member
      await tx.insert(organizationMembers).values({
        orgId: org.id,
        userId: userId,
        role: 'OWNER',
      });

      return org;
    });
  }

  /**
   * Find all organizations for a user with their membership roles and pagination
   */
  async findAllByUserId(
    userId: string,
    options: FindAllOptions = {},
  ): Promise<PaginatedResponse<OrganizationWithRole>> {
    const { page = 1, limit = 10 } = options;
    const offset = (page - 1) * limit;

    this.logger.debug(
      `Finding all organizations for user ${userId} (page: ${page}, limit: ${limit})`,
    );

    return withServiceContext(
      'OrganizationsRepository.findAllByUserId',
      async (tx) => {
        // Get all memberships for the user
        const memberships = await tx
          .select({
            orgId: organizationMembers.orgId,
            role: organizationMembers.role,
          })
          .from(organizationMembers)
          .where(eq(organizationMembers.userId, userId));

        if (memberships.length === 0) {
          return {
            items: [],
            total: 0,
            page,
            limit,
          };
        }

        // Get total count
        const total = memberships.length;

        // Apply pagination to memberships
        const paginatedMemberships = memberships.slice(offset, offset + limit);

        // Fetch organizations for the paginated memberships
        const orgIds = paginatedMemberships.map((m) => m.orgId);
        const orgs = await tx
          .select()
          .from(organizations)
          .where(inArray(organizations.id, orgIds));

        // Combine organizations with their roles
        const items = orgs.filter(Boolean).map((org) => ({
          ...org,
          role: memberships.find((m) => m.orgId === org.id)?.role,
        }));

        return {
          items,
          total,
          page,
          limit,
        };
      },
    );
  }

  /**
   * Find a single organization by ID within tenant context
   */
  async findById(ctx: TenantContext, orgId: string): Promise<Organization | null> {
    this.logger.debug(`Finding organization ${orgId}`);

    return withTenantContext(ctx, async (tx) => {
      const [org] = await tx
        .select()
        .from(organizations)
        .where(eq(organizations.id, orgId));
      return org || null;
    });
  }

  /**
   * Update an organization within tenant context
   */
  async update(
    ctx: TenantContext,
    orgId: string,
    data: Partial<Pick<Organization, 'name' | 'logo' | 'timezone' | 'language'>>,
  ): Promise<Organization | null> {
    this.logger.debug(`Updating organization ${orgId}`);

    return withTenantContext(ctx, async (tx) => {
      const [org] = await tx
        .update(organizations)
        .set(data)
        .where(eq(organizations.id, orgId))
        .returning();
      return org || null;
    });
  }

  /**
   * Delete an organization within tenant context
   */
  async delete(ctx: TenantContext, orgId: string): Promise<boolean> {
    this.logger.debug(`Deleting organization ${orgId}`);

    return withTenantContext(ctx, async (tx) => {
      const result = await tx
        .delete(organizations)
        .where(eq(organizations.id, orgId))
        .returning();
      return result.length > 0;
    });
  }

  /**
   * Find membership for a user in an organization
   */
  async findMembership(
    userId: string,
    orgId: string,
  ): Promise<MembershipResult | null> {
    this.logger.debug(`Finding membership for user ${userId} in org ${orgId}`);

    return withServiceContext(
      'OrganizationsRepository.findMembership',
      async (tx) => {
        const [membership] = await tx
          .select({ role: organizationMembers.role })
          .from(organizationMembers)
          .where(
            and(
              eq(organizationMembers.userId, userId),
              eq(organizationMembers.orgId, orgId),
            ),
          )
          .limit(1);

        return membership || null;
      },
    );
  }
}

