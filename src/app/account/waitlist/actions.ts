'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireUser } from '@/lib/auth/current-user';
import { deleteSignup, updateSignupStatus } from '@/lib/db/queries/waitlist';

const UpdateInput = z.object({
  id: z.string().uuid(),
  status: z.enum(['pending', 'contacted', 'installed', 'declined']),
  notes: z.string().max(1000).optional().nullable(),
});

export async function setSignupStatus(raw: unknown) {
  await requireUser();
  const { id, status, notes } = UpdateInput.parse(raw);
  await updateSignupStatus(id, status, notes ?? null);
  revalidatePath('/account/waitlist');
}

export async function removeSignup(id: string) {
  await requireUser();
  z.string().uuid().parse(id);
  await deleteSignup(id);
  revalidatePath('/account/waitlist');
}
