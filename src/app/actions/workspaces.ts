'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth/current-user';
import {
  deleteWorkspaceById,
  getWorkspaceBySlug,
  insertWorkspace,
  updateWorkspaceById,
} from '@/lib/db/queries/workspaces';
import { logger } from '@/lib/logger';
import {
  autoSlug,
  createWorkspaceSchema,
  updateWorkspaceSchema,
} from '@/lib/schemas/workspaces';

export type ActionResult<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export async function createWorkspace(
  input: unknown,
): Promise<ActionResult<{ id: string; slug: string }>> {
  const parsed = createWorkspaceSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }
  const user = await requireUser();
  const slug = parsed.data.slug ?? autoSlug(parsed.data.name);
  if (!slug) return { ok: false, error: 'Could not derive slug from name' };

  const existing = await getWorkspaceBySlug(slug, user.id);
  if (existing) return { ok: false, error: `Slug "${slug}" already in use` };

  try {
    const ws = await insertWorkspace({
      userId: user.id,
      name: parsed.data.name,
      slug,
      description: parsed.data.description,
    });
    revalidatePath('/workspaces');
    return { ok: true, data: { id: ws.id, slug: ws.slug } };
  } catch (err) {
    logger.error({ err }, 'createWorkspace failed');
    return { ok: false, error: 'Could not create workspace' };
  }
}

export async function updateWorkspace(
  id: string,
  input: unknown,
): Promise<ActionResult<true>> {
  const parsed = updateWorkspaceSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }
  const user = await requireUser();
  const updated = await updateWorkspaceById(id, user.id, parsed.data);
  if (!updated) return { ok: false, error: 'Workspace not found' };
  revalidatePath('/workspaces');
  revalidatePath(`/workspaces/${id}`);
  return { ok: true, data: true };
}

export async function deleteWorkspace(id: string): Promise<ActionResult<true>> {
  const user = await requireUser();
  const ok = await deleteWorkspaceById(id, user.id);
  if (!ok) return { ok: false, error: 'Workspace not found' };
  revalidatePath('/workspaces');
  redirect('/workspaces');
}
