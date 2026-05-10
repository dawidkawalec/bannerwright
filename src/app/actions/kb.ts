'use server';

import { revalidatePath } from 'next/cache';
import { requireUser } from '@/lib/auth/current-user';
import { getWorkspaceForUser } from '@/lib/db/queries/workspaces';
import {
  deleteKbSourceById,
  getKbSourceForWorkspace,
  insertKbSourceUrl,
} from '@/lib/db/queries/kb';
import { processKbUrl } from '@/lib/kb/process-url';
import { logger } from '@/lib/logger';
import { addKbUrlSchema } from '@/lib/schemas/kb';
import { getStorage } from '@/lib/storage';
import type { ActionResult } from './workspaces';

export async function addKbSourceUrl(
  workspaceId: string,
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const parsed = addKbUrlSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid URL' };
  }
  const user = await requireUser();
  const workspace = await getWorkspaceForUser(workspaceId, user.id);
  if (!workspace) return { ok: false, error: 'Workspace not found' };

  try {
    const source = await insertKbSourceUrl(workspace.id, parsed.data.url);
    revalidatePath(`/workspaces/${workspace.id}/knowledge-base`);

    // Fire-and-forget — never await; status updates land in the DB.
    void processKbUrl(source.id).catch((err) => {
      logger.error({ err, sourceId: source.id }, 'fire-and-forget kb worker rejected');
    });

    return { ok: true, data: { id: source.id } };
  } catch (err) {
    logger.error({ err }, 'addKbSourceUrl failed');
    return { ok: false, error: 'Could not add KB source' };
  }
}

export async function reprocessKbSource(
  workspaceId: string,
  id: string,
): Promise<ActionResult<true>> {
  const user = await requireUser();
  const workspace = await getWorkspaceForUser(workspaceId, user.id);
  if (!workspace) return { ok: false, error: 'Workspace not found' };
  const source = await getKbSourceForWorkspace(id, workspace.id);
  if (!source) return { ok: false, error: 'Source not found' };
  if (source.sourceType !== 'url') {
    return { ok: false, error: 'Reprocessing is only supported for URL sources' };
  }
  void processKbUrl(source.id).catch((err) =>
    logger.error({ err, sourceId: source.id }, 'reprocess rejected'),
  );
  revalidatePath(`/workspaces/${workspace.id}/knowledge-base`);
  return { ok: true, data: true };
}

export async function deleteKbSource(
  workspaceId: string,
  id: string,
): Promise<ActionResult<true>> {
  const user = await requireUser();
  const workspace = await getWorkspaceForUser(workspaceId, user.id);
  if (!workspace) return { ok: false, error: 'Workspace not found' };
  const source = await getKbSourceForWorkspace(id, workspace.id);
  if (!source) return { ok: false, error: 'Source not found' };

  if (source.screenshotPath) {
    await getStorage()
      .delete(source.screenshotPath)
      .catch((err) => logger.warn({ err, key: source.screenshotPath }, 'screenshot delete failed'));
  }
  const ok = await deleteKbSourceById(id, workspace.id);
  if (!ok) return { ok: false, error: 'Could not delete' };
  revalidatePath(`/workspaces/${workspace.id}/knowledge-base`);
  return { ok: true, data: true };
}
