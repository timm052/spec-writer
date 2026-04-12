import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/schema/index.ts',
  out: './migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL || 'postgresql://specwriter:devpassword@localhost:5432/specwriter_dev',
  },
  verbose: true,
  strict: true,
});
