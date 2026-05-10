import { eq } from 'drizzle-orm';
import { db } from './client';
import { users, workspaces } from './schema';
import { env } from '../env';

async function main() {
  const existing = await db.select().from(users).where(eq(users.email, env.ADMIN_EMAIL));

  let userId: string;
  if (existing.length === 0) {
    const [created] = await db
      .insert(users)
      .values({ email: env.ADMIN_EMAIL, passwordHash: env.ADMIN_PASSWORD_HASH })
      .returning({ id: users.id });
    userId = created!.id;
    console.log(`✅ Created admin user: ${env.ADMIN_EMAIL}`);
  } else {
    userId = existing[0]!.id;
    console.log(`ℹ️  Admin user already exists: ${env.ADMIN_EMAIL}`);
  }

  const demoSlug = 'demo';
  const demoExists = await db
    .select()
    .from(workspaces)
    .where(eq(workspaces.slug, demoSlug));

  if (demoExists.length === 0) {
    await db.insert(workspaces).values({
      userId,
      name: 'Demo Workspace',
      slug: demoSlug,
      description: 'Sample workspace — feel free to delete.',
      brandColors: { primary: '#0F172A', accent: '#6366F1' },
      brandFonts: { headline: 'Inter', body: 'Inter' },
    });
    console.log('✅ Created demo workspace');
  } else {
    console.log('ℹ️  Demo workspace already exists');
  }

  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
