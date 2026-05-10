import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { invalidateSession, SESSION_COOKIE_NAME } from '@/lib/auth/sessions';

export const runtime = 'nodejs';

export async function POST() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE_NAME)?.value;
  if (token) {
    await invalidateSession(token);
    store.delete(SESSION_COOKIE_NAME);
  }
  return NextResponse.json({ ok: true });
}
