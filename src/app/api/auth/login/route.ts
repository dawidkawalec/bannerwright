import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { db } from '@/lib/db/client';
import { users } from '@/lib/db/schema';
import { verifyPassword } from '@/lib/auth/passwords';
import {
  createSession,
  generateSessionToken,
  sessionCookieOptions,
} from '@/lib/auth/sessions';
import { loginSchema } from '@/lib/schemas/auth';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 400 });
  }

  const { email, password } = parsed.data;
  const [user] = await db.select().from(users).where(eq(users.email, email));
  if (!user) {
    // Constant-time fake check to avoid user-enumeration timing.
    await verifyPassword(
      '$argon2id$v=19$m=19456,t=2,p=1$YWJjZGVmZ2g$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      password,
    ).catch(() => false);
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  const ok = await verifyPassword(user.passwordHash, password).catch((err) => {
    logger.error({ err }, 'argon2 verify failed');
    return false;
  });

  if (!ok) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  const token = generateSessionToken();
  const session = await createSession(token, user.id);
  const opts = sessionCookieOptions(session.expiresAt);
  const store = await cookies();
  store.set(opts.name, token, opts);

  return NextResponse.json({ ok: true });
}
