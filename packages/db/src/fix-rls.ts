/* eslint-disable no-console */
/**
 * Fix RLS policies for organization creation
 */

import 'dotenv/config';
import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function fixRlsPolicies() {
  const pool = new Pool({
    connectionString:
      process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/forgestack_dev',
  });

  try {
    console.log('Fixing RLS policies...');

    // Read the migration file
    const sqlPath = path.join(__dirname, '../drizzle/0014_fix_rls_policies.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Remove comments and split by semicolons
    const cleanedSql = sql
      .split('\n')
      .filter(line => !line.trim().startsWith('--'))
      .join('\n');

    // Split by semicolons, keeping the semicolon
    const statements = cleanedSql.split(';').map(s => s.trim()).filter(s => s.length > 0);

    for (const statement of statements) {
      try {
        await pool.query(statement + ';');
        const preview = statement.replace(/\s+/g, ' ').substring(0, 60);
        console.log('✓ ' + preview + '...');
      } catch (err: unknown) {
        const error = err as Error;
        // Ignore "policy does not exist" errors for DROP POLICY
        if (!error.message?.includes('does not exist')) {
          console.error('Failed statement:', statement);
          throw err;
        }
        console.log('⊘ Skipped (already dropped): ' + statement.substring(0, 40) + '...');
      }
    }

    console.log('\n✅ RLS policies fixed successfully!');
  } catch (err) {
    console.error('Failed to fix RLS policies:', err);
    throw err;
  } finally {
    await pool.end();
  }
}

fixRlsPolicies().catch((err) => {
  console.error(err);
  process.exit(1);
});

