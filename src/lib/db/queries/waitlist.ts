import 'server-only';
import { desc, eq, sql } from 'drizzle-orm';
import { db } from '../client';
import { waitlistSignups, type WaitlistStatus } from '../schema';

export async function listWaitlistSignups() {
  return db.select().from(waitlistSignups).orderBy(desc(waitlistSignups.createdAt));
}

export async function getWaitlistStats() {
  const rows = await db
    .select({ status: waitlistSignups.status, count: sql<number>`count(*)::int` })
    .from(waitlistSignups)
    .groupBy(waitlistSignups.status);

  const stats = { pending: 0, contacted: 0, installed: 0, declined: 0, total: 0 };
  for (const row of rows) {
    const key = row.status as WaitlistStatus;
    if (key in stats) {
      (stats as Record<string, number>)[key] = row.count;
      stats.total += row.count;
    }
  }
  return stats;
}

export async function updateSignupStatus(
  id: string,
  status: WaitlistStatus,
  notes?: string | null,
) {
  await db
    .update(waitlistSignups)
    .set({
      status,
      contactedAt: status === 'contacted' ? new Date() : undefined,
      ...(notes !== undefined ? { notes } : {}),
    })
    .where(eq(waitlistSignups.id, id));
}

export async function deleteSignup(id: string) {
  await db.delete(waitlistSignups).where(eq(waitlistSignups.id, id));
}
