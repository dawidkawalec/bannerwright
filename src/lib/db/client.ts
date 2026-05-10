import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { env } from '../env';
import * as schema from './schema';

declare global {
  var __bw_pg: ReturnType<typeof postgres> | undefined;
  var __bw_db: ReturnType<typeof drizzle<typeof schema>> | undefined;
}

const client =
  global.__bw_pg ??
  postgres(env.DATABASE_URL, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
  });

export const db = global.__bw_db ?? drizzle(client, { schema, casing: 'snake_case' });

if (env.NODE_ENV !== 'production') {
  global.__bw_pg = client;
  global.__bw_db = db;
}

export { schema };
