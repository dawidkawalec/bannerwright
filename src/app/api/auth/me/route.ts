import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/current-user';

export const runtime = 'nodejs';

export async function GET() {
  const { user } = await getSession();
  if (!user) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  return NextResponse.json({ id: user.id, email: user.email });
}
