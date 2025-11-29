/**
 * Database client configuration
 *
 * Provides connection pool and Drizzle ORM instance
 */

import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema/index.js';

// Create connection pool
const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/forgestack_dev',
  max: parseInt(process.env.DB_POOL_MAX || '10', 10),
  min: parseInt(process.env.DB_POOL_MIN || '2', 10),
});

// Create Drizzle instance with schema
export const db = drizzle(pool, { schema });

// Export pool for direct access if needed
export { pool };

// Export schema for convenience
export { schema };

/**
 * Close the database pool
 * Should be called when shutting down the application or after tests
 */
export async function closePool(): Promise<void> {
  await pool.end();
}

