import { NextResponse } from 'next/server';
import { sql } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import packageJson from '../../../../package.json' with { type: 'json' };

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const checks: Record<string, 'ok' | 'fail' | 'skipped'> = {
    db: 'fail',
    env: 'ok',
  };

  try {
    await db.execute(sql`SELECT 1`);
    checks.db = 'ok';
  } catch {
    checks.db = 'fail';
  }

  const allOk = Object.values(checks).every((v) => v !== 'fail');
  return NextResponse.json(
    {
      status: allOk ? 'ok' : 'degraded',
      version: packageJson.version,
      checks,
      timestamp: new Date().toISOString(),
    },
    { status: allOk ? 200 : 503 },
  );
}
