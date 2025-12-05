/**
 * Tenant context utilities for RLS enforcement
 *
 * All org-scoped database queries MUST go through withTenantContext()
 * to ensure RLS policies are properly enforced.
 */

import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { pool } from './client.js';
import * as schema from './schema/index.js';
import type { DatabaseContext } from './types/index.js';
import { isServiceContext } from './types/index.js';
import { UUID_REGEX } from '@forgestack/shared';

// Type for the database instance
type DbInstance = NodePgDatabase<typeof schema>;

/**
 * Execute a database operation within a tenant context.
 *
 * This function:
 * 1. Starts a transaction
 * 2. Sets PostgreSQL session variables for RLS
 * 3. Executes the callback
 * 4. Commits or rolls back based on success/failure
 *
 * @param ctx - The tenant or service context
 * @param fn - The database operation to execute
 * @returns The result of the callback function
 *
 * @example
 * ```typescript
 * const projects = await withTenantContext(
 *   { orgId: 'xxx', userId: 'yyy', role: 'OWNER' },
 *   async (tx) => {
 *     return await tx.select().from(projectsTable);
 *   }
 * );
 * ```
 */
export async function withTenantContext<T>(
  ctx: DatabaseContext,
  fn: (tx: DbInstance) => Promise<T>
): Promise<T> {
  // Validate context
  if (!ctx) {
    throw new Error('Database context is required');
  }

  // Get a client from the pool for this transaction
  const client = await pool.connect();

  try {
    // Start transaction
    await client.query('BEGIN');

    // Set session variables based on context type
    // Note: SET LOCAL doesn't support parameterized queries, so we use
    // set_config() which is SQL injection safe
    if (isServiceContext(ctx)) {
      // Service context - bypass RLS
      await client.query(`SELECT set_config('app.bypass_rls', 'true', true)`);
      await client.query(`SELECT set_config('app.service_reason', $1, true)`, [ctx.reason]);
    } else {
      // Tenant context - set RLS variables
      // Validate ID formats (parameterized queries prevent SQL injection)
      // All IDs are UUIDs (better-auth configured to generate UUIDs)
      if (!UUID_REGEX.test(ctx.orgId)) {
        throw new Error('Invalid orgId format');
      }
      if (!UUID_REGEX.test(ctx.userId)) {
        throw new Error('Invalid userId format');
      }
      if (ctx.role !== 'OWNER' && ctx.role !== 'MEMBER') {
        throw new Error('Invalid role');
      }

      await client.query(`SELECT set_config('app.current_org_id', $1, true)`, [ctx.orgId]);
      await client.query(`SELECT set_config('app.current_user_id', $1, true)`, [ctx.userId]);
      await client.query(`SELECT set_config('app.current_role', $1, true)`, [ctx.role]);
    }

    // Create a Drizzle instance using this client
    const txDb = drizzle(client, { schema });

    const result = await fn(txDb);

    // Commit transaction
    await client.query('COMMIT');

    return result;
  } catch (error) {
    // Rollback on error
    await client.query('ROLLBACK');
    // Log the actual database error for debugging
    if (error && typeof error === 'object') {
      const dbError = error as Record<string, unknown>;
      if (dbError.code || dbError.detail || dbError.constraint) {
        console.error('[DB Error]', {
          code: dbError.code,
          message: dbError.message,
          detail: dbError.detail,
          constraint: dbError.constraint,
          table: dbError.table,
          column: dbError.column,
        });
      }
    }
    throw error;
  } finally {
    // Release client back to pool
    client.release();
  }
}

/**
 * Execute a database operation with service context (bypasses RLS).
 *
 * WARNING: This should only be used for:
 * - Migrations
 * - Admin/system operations
 * - Background job processing
 *
 * NEVER expose this to user-facing API routes.
 *
 * @param reason - Audit reason for bypassing RLS
 * @param fn - The database operation to execute
 */
export async function withServiceContext<T>(
  reason: string,
  fn: (tx: DbInstance) => Promise<T>
): Promise<T> {
  return withTenantContext({ bypassRls: true, reason }, fn);
}

