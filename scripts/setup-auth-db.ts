import { getMigrations } from 'better-auth/db/migration';
import { Pool } from 'pg';
import { readFile } from 'node:fs/promises';
async function main() {
  // Match the content migration script without relying on Next's transitive dependencies.
  for (const filename of ['.env.local', '.env']) {
    if (process.env.DATABASE_URL) break;
    try {
      process.loadEnvFile(filename);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    }
  }
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const migration = await getMigrations({ database: pool });
    await migration.runMigrations();
    await pool.query(await readFile(new URL('../db/003_create_user_study_state.sql', import.meta.url), 'utf8'));
    console.log('Authentication and study-state tables are ready.');
  } finally { await pool.end(); }
}
main().catch(() => { console.error('Auth migration failed. Check DATABASE_URL and database connectivity.'); process.exitCode = 1; });
