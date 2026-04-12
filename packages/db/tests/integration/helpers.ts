/**
 * Shared setup for DB integration tests.
 *
 * Each test file calls `setupTestDb()` in beforeAll and `teardownTestDb()` in afterAll.
 * A PostgreSQL container is started per test file, migrations are applied, and a
 * Drizzle instance is returned. This avoids touching the application singleton
 * (packages/db/src/index.ts) and its process.env.DATABASE_URL dependency.
 */
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';
import * as schema from '../../src/schema/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = path.resolve(__dirname, '../../migrations');

export type TestDb = NodePgDatabase<typeof schema>;

interface TestContext {
  db: TestDb;
  container: StartedPostgreSqlContainer;
  pool: Pool;
}

export async function setupTestDb(): Promise<TestContext> {
  const container = await new PostgreSqlContainer('postgres:16-alpine').start().catch((err: Error) => {
    throw new Error(
      `Docker is not available — start Docker Desktop before running integration tests.\n${err.message}`,
    );
  });
  const pool = new Pool({ connectionString: container.getConnectionUri() });
  const db = drizzle({ client: pool, schema }) as TestDb;
  await migrate(db, { migrationsFolder: MIGRATIONS_DIR });
  return { db, container, pool };
}

export async function teardownTestDb(ctx: TestContext): Promise<void> {
  await ctx.pool.end();
  await ctx.container.stop();
}
