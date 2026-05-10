import { sha256 } from '@oslojs/crypto/sha2';
import {
  encodeBase32LowerCaseNoPadding,
  encodeHexLowerCase,
} from '@oslojs/encoding';
import { eq } from 'drizzle-orm';
import { db } from '../db/client';
import { sessions, users, type Session, type User } from '../db/schema';

const SESSION_DURATION_DAYS = 30;
const REFRESH_THRESHOLD_DAYS = 15;

const dayMs = 24 * 60 * 60 * 1000;

export function generateSessionToken(): string {
  const bytes = new Uint8Array(20);
  crypto.getRandomValues(bytes);
  return encodeBase32LowerCaseNoPadding(bytes);
}

function tokenToSessionId(token: string): string {
  return encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
}

export async function createSession(token: string, userId: string): Promise<Session> {
  const id = tokenToSessionId(token);
  const expiresAt = new Date(Date.now() + SESSION_DURATION_DAYS * dayMs);
  const [row] = await db
    .insert(sessions)
    .values({ id, userId, expiresAt })
    .returning();
  return row!;
}

export type SessionValidation =
  | { session: Session; user: User }
  | { session: null; user: null };

export async function validateSessionToken(token: string): Promise<SessionValidation> {
  const id = tokenToSessionId(token);
  const [row] = await db
    .select({ session: sessions, user: users })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(eq(sessions.id, id));

  if (!row) return { session: null, user: null };

  if (Date.now() >= row.session.expiresAt.getTime()) {
    await db.delete(sessions).where(eq(sessions.id, id));
    return { session: null, user: null };
  }

  // Sliding refresh: extend if past 50% lifetime.
  const refreshAt = row.session.expiresAt.getTime() - REFRESH_THRESHOLD_DAYS * dayMs;
  if (Date.now() >= refreshAt) {
    const newExpiresAt = new Date(Date.now() + SESSION_DURATION_DAYS * dayMs);
    await db.update(sessions).set({ expiresAt: newExpiresAt }).where(eq(sessions.id, id));
    row.session.expiresAt = newExpiresAt;
  }

  return { session: row.session, user: row.user };
}

export async function invalidateSession(token: string): Promise<void> {
  const id = tokenToSessionId(token);
  await db.delete(sessions).where(eq(sessions.id, id));
}

export async function invalidateAllUserSessions(userId: string): Promise<void> {
  await db.delete(sessions).where(eq(sessions.userId, userId));
}

export const SESSION_COOKIE_NAME = 'bw_session';

export function sessionCookieOptions(expiresAt: Date) {
  return {
    name: SESSION_COOKIE_NAME,
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    expires: expiresAt,
    path: '/',
  };
}
