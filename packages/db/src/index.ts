import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema/index.js';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://specwriter:devpassword@localhost:5432/specwriter_dev',
});

export const db = drizzle({ client: pool, schema });

export * from './schema/index.js';
export type * from './schema/index.js';
export * from './queries/index.js';
