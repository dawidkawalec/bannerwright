'use server';

import { z } from 'zod';
import { db } from '@/lib/db/client';
import { waitlistSignups } from '@/lib/db/schema';
import { revalidatePath } from 'next/cache';

const VALID_SOURCES = [
  'announcement_banner',
  'final_cta',
  'direct',
  'docs',
  'other',
] as const;

const WaitlistInput = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email'),
  name: z
    .string()
    .trim()
    .max(120, 'Keep it under 120 characters')
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined)),
  useCase: z
    .string()
    .trim()
    .max(500, 'Keep it under 500 characters')
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined)),
  source: z
    .enum(VALID_SOURCES)
    .optional()
    .transform((v) => v ?? 'direct'),
});

export type WaitlistInputType = z.input<typeof WaitlistInput>;

export type WaitlistResult =
  | { ok: true; alreadyOnList: boolean }
  | { ok: false; error: string };

export async function submitWaitlist(raw: unknown): Promise<WaitlistResult> {
  const parsed = WaitlistInput.safeParse(raw);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false, error: first?.message ?? 'Invalid input' };
  }

  const { email, name, useCase, source } = parsed.data;

  try {
    const inserted = await db
      .insert(waitlistSignups)
      .values({ email, name, useCase, source })
      .onConflictDoNothing({ target: waitlistSignups.email })
      .returning({ id: waitlistSignups.id });

    revalidatePath('/account/waitlist');

    return { ok: true, alreadyOnList: inserted.length === 0 };
  } catch {
    return { ok: false, error: 'Could not save right now — try again in a moment.' };
  }
}
