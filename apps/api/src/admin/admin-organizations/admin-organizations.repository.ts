/**
 * Admin Organizations Repository
 * Database operations for super-admin organization management
 */

import { Injectable, Logger } from '@nestjs/common';
import {
  eq,
  ilike,
  and,
  desc,
  sql,
  isNotNull,
  isNull,
  withServiceContext,
  organizations,
  type Organization,
} from '@forgestack/db';

export interface FindAllOrganizationsOptions {
  search?: string;
  suspended?: boolean;
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

@Injectable()
export class AdminOrganizationsRepository {
  private readonly logger = new Logger(AdminOrganizationsRepository.name);

  /**
   * Find all organizations with filters and pagination
   * NOTE: This bypasses RLS - super-admin only
   */
  async findAll(options: FindAllOrganizationsOptions): Promise<PaginatedResult<Organization>> {
    const { search, suspended, page = 1, limit = 50 } = options;

    return withServiceContext('AdminOrganizationsRepository.findAll', async (tx) => {
      const conditions = [];

      if (search) {
        conditions.push(ilike(organizations.name, `%${search}%`));
      }

      if (suspended !== undefined) {
        if (suspended) {
          conditions.push(isNotNull(organizations.suspendedAt));
        } else {
          conditions.push(isNull(organizations.suspendedAt));
        }
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      // Get total count
      const [{ count }] = await tx
        .select({ count: sql<number>`count(*)::int` })
        .from(organizations)
        .where(whereClause);

      // Get paginated results
      const offset = (page - 1) * limit;
      const items = await tx
        .select()
        .from(organizations)
        .where(whereClause)
        .orderBy(desc(organizations.createdAt))
        .limit(limit)
        .offset(offset);

      return {
        items,
        total: count,
        page,
        limit,
      };
    });
  }

  /**
   * Find an organization by ID
   */
  async findById(id: string): Promise<Organization | null> {
    return withServiceContext('AdminOrganizationsRepository.findById', async (tx) => {
      const [org] = await tx
        .select()
        .from(organizations)
        .where(eq(organizations.id, id))
        .limit(1);

      return org || null;
    });
  }

  /**
   * Suspend an organization
   */
  async suspend(id: string, reason: string, suspendedBy: string): Promise<Organization> {
    return withServiceContext('AdminOrganizationsRepository.suspend', async (tx) => {
      const [org] = await tx
        .update(organizations)
        .set({
          suspendedAt: new Date(),
          suspendedReason: reason,
          suspendedBy,
        })
        .where(eq(organizations.id, id))
        .returning();

      return org;
    });
  }

  /**
   * Unsuspend an organization
   */
  async unsuspend(id: string): Promise<Organization> {
    return withServiceContext('AdminOrganizationsRepository.unsuspend', async (tx) => {
      const [org] = await tx
        .update(organizations)
        .set({
          suspendedAt: null,
          suspendedReason: null,
          suspendedBy: null,
        })
        .where(eq(organizations.id, id))
        .returning();

      return org;
    });
  }

  /**
   * Delete an organization
   */
  async delete(id: string): Promise<void> {
    return withServiceContext('AdminOrganizationsRepository.delete', async (tx) => {
      await tx.delete(organizations).where(eq(organizations.id, id));
    });
  }

  /**
   * Transfer organization ownership
   */
  async transferOwnership(id: string, newOwnerId: string): Promise<Organization> {
    return withServiceContext('AdminOrganizationsRepository.transferOwnership', async (tx) => {
      const [org] = await tx
        .update(organizations)
        .set({
          ownerUserId: newOwnerId,
        })
        .where(eq(organizations.id, id))
        .returning();

      return org;
    });
  }
}

