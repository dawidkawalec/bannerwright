import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import {
  SESSION_COOKIE_NAME,
  validateSessionToken,
  type SessionValidation,
} from './sessions';

export async function getSession(): Promise<SessionValidation> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return { session: null, user: null };
  return validateSessionToken(token);
}

export async function requireUser() {
  const { user } = await getSession();
  if (!user) redirect('/login');
  return user;
}
