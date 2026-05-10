import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { env } from '../env';

async function main() {
  const sql = postgres(env.DATABASE_URL, { max: 1 });

  // Ensure required extensions exist before migrations run.
  await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;
  await sql`CREATE EXTENSION IF NOT EXISTS "pg_trgm"`;
  await sql`CREATE EXTENSION IF NOT EXISTS "vector"`;

  const db = drizzle(sql);
  await migrate(db, { migrationsFolder: './src/lib/db/migrations' });

  await sql.end();
  console.log('✅ Migrations applied');
}

main().catch((err) => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
