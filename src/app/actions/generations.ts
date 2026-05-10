'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth/current-user';
import {
  deleteGenerationById,
  getGenerationForWorkspace,
} from '@/lib/db/queries/generations';
import { getWorkspaceForUser } from '@/lib/db/queries/workspaces';
import { logger } from '@/lib/logger';
import { getStorage } from '@/lib/storage';
import type { ActionResult } from './workspaces';

export async function deleteGeneration(
  workspaceId: string,
  id: string,
): Promise<ActionResult<true>> {
  const user = await requireUser();
  const workspace = await getWorkspaceForUser(workspaceId, user.id);
  if (!workspace) return { ok: false, error: 'Workspace not found' };
  const generation = await getGenerationForWorkspace(id, workspace.id);
  if (!generation) return { ok: false, error: 'Generation not found' };

  if (generation.currentPngPath) {
    await getStorage()
      .delete(generation.currentPngPath)
      .catch((err) => logger.warn({ err }, 'png delete failed'));
  }
  const ok = await deleteGenerationById(id, workspace.id);
  if (!ok) return { ok: false, error: 'Could not delete' };
  revalidatePath(`/workspaces/${workspace.id}/generations`);
  redirect(`/workspaces/${workspace.id}/generations`);
}
