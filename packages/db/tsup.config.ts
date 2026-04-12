import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  external: ['drizzle-orm', 'pg', '@auth/core', '@auth/drizzle-adapter'],
});
