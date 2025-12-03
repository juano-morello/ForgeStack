/**
 * Admin Users Repository
 * Database operations for super-admin user management
 */

import { Injectable, Logger } from '@nestjs/common';
import {
  eq,
  ilike,
  or,
  and,
  desc,
  sql,
  isNotNull,
  isNull,
  withServiceContext,
  users,
  type User,
} from '@forgestack/db';

export interface FindAllUsersOptions {
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
export class AdminUsersRepository {
  private readonly logger = new Logger(AdminUsersRepository.name);

  /**
   * Find all users with filters and pagination
   * NOTE: This bypasses RLS - super-admin only
   */
  async findAll(options: FindAllUsersOptions): Promise<PaginatedResult<User>> {
    const { search, suspended, page = 1, limit = 50 } = options;

    return withServiceContext('AdminUsersRepository.findAll', async (tx) => {
      const conditions = [];

      if (search) {
        conditions.push(
          or(
            ilike(users.name, `%${search}%`),
            ilike(users.email, `%${search}%`),
          ),
        );
      }

      if (suspended !== undefined) {
        if (suspended) {
          conditions.push(isNotNull(users.suspendedAt));
        } else {
          conditions.push(isNull(users.suspendedAt));
        }
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      // Get total count
      const [{ count }] = await tx
        .select({ count: sql<number>`count(*)::int` })
        .from(users)
        .where(whereClause);

      // Get paginated results
      const offset = (page - 1) * limit;
      const items = await tx
        .select()
        .from(users)
        .where(whereClause)
        .orderBy(desc(users.createdAt))
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
   * Find a user by ID
   */
  async findById(id: string): Promise<User | null> {
    return withServiceContext('AdminUsersRepository.findById', async (tx) => {
      const [user] = await tx
        .select()
        .from(users)
        .where(eq(users.id, id))
        .limit(1);

      return user || null;
    });
  }

  /**
   * Suspend a user
   */
  async suspend(id: string, reason: string, suspendedBy: string): Promise<User> {
    return withServiceContext('AdminUsersRepository.suspend', async (tx) => {
      const [user] = await tx
        .update(users)
        .set({
          suspendedAt: new Date(),
          suspendedReason: reason,
          suspendedBy,
        })
        .where(eq(users.id, id))
        .returning();

      return user;
    });
  }

  /**
   * Unsuspend a user
   */
  async unsuspend(id: string): Promise<User> {
    return withServiceContext('AdminUsersRepository.unsuspend', async (tx) => {
      const [user] = await tx
        .update(users)
        .set({
          suspendedAt: null,
          suspendedReason: null,
          suspendedBy: null,
        })
        .where(eq(users.id, id))
        .returning();

      return user;
    });
  }

  /**
   * Delete a user
   */
  async delete(id: string): Promise<void> {
    return withServiceContext('AdminUsersRepository.delete', async (tx) => {
      await tx.delete(users).where(eq(users.id, id));
    });
  }

  /**
   * Update last login timestamp
   */
  async updateLastLogin(id: string): Promise<void> {
    return withServiceContext('AdminUsersRepository.updateLastLogin', async (tx) => {
      await tx
        .update(users)
        .set({
          lastLoginAt: new Date(),
        })
        .where(eq(users.id, id));
    });
  }
}

