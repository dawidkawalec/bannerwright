import { defineConfig } from 'drizzle-kit';
import { env } from './src/lib/env';

export default defineConfig({
  schema: './src/lib/db/schema.ts',
  out: './src/lib/db/migrations',
  dialect: 'postgresql',
  dbCredentials: { url: env.DATABASE_URL },
  casing: 'snake_case',
  verbose: true,
  strict: true,
});
