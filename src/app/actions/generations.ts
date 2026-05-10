'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth/current-user';
import {
  deleteGenerationById,
  getGenerationForWorkspace,
  getVersion,
  insertGenerationVersion,
  nextVersionNumber,
  recordChatMessage,
  updateGenerationCurrentHtml,
} from '@/lib/db/queries/generations';
import { getWorkspaceForUser } from '@/lib/db/queries/workspaces';
import { logger } from '@/lib/logger';
import { renderHtmlToPng } from '@/lib/renderer/render-png';
import { getStorage } from '@/lib/storage';
import type { ActionResult } from './workspaces';

export async function saveManualEdit(
  workspaceId: string,
  id: string,
  html: string,
): Promise<ActionResult<{ versionNumber: number; versionId: string }>> {
  if (typeof html !== 'string' || html.length === 0) {
    return { ok: false, error: 'HTML is empty' };
  }
  if (html.length > 500_000) {
    return { ok: false, error: 'HTML over 500 KB — that is not a banner' };
  }
  const user = await requireUser();
  const workspace = await getWorkspaceForUser(workspaceId, user.id);
  if (!workspace) return { ok: false, error: 'Workspace not found' };
  const generation = await getGenerationForWorkspace(id, workspace.id);
  if (!generation) return { ok: false, error: 'Generation not found' };

  if (html === generation.currentHtml) {
    return { ok: false, error: 'No changes to save' };
  }

  try {
    const versionNumber = await nextVersionNumber(generation.id);
    const version = await insertGenerationVersion({
      generationId: generation.id,
      versionNumber,
      html,
      triggeredBy: 'manual_edit',
    });

    let pngKey: string | undefined;
    try {
      const rendered = await renderHtmlToPng({
        html,
        format: generation.format,
        generationId: generation.id,
      });
      pngKey = rendered.pngKey;
    } catch (err) {
      logger.warn({ err, generationId: id }, 'PNG render failed during manual save');
    }

    await updateGenerationCurrentHtml(generation.id, html, pngKey);
    revalidatePath(`/workspaces/${workspace.id}/generations/${id}`);
    return { ok: true, data: { versionNumber, versionId: version.id } };
  } catch (err) {
    logger.error({ err, generationId: id }, 'saveManualEdit failed');
    return { ok: false, error: 'Could not save' };
  }
}

export async function restoreVersion(
  workspaceId: string,
  generationId: string,
  versionId: string,
): Promise<ActionResult<{ versionNumber: number; versionId: string }>> {
  const user = await requireUser();
  const workspace = await getWorkspaceForUser(workspaceId, user.id);
  if (!workspace) return { ok: false, error: 'Workspace not found' };
  const generation = await getGenerationForWorkspace(generationId, workspace.id);
  if (!generation) return { ok: false, error: 'Generation not found' };

  const target = await getVersion(versionId);
  if (!target || target.generationId !== generation.id) {
    return { ok: false, error: 'Version not found' };
  }

  try {
    const versionNumber = await nextVersionNumber(generation.id);
    const newVersion = await insertGenerationVersion({
      generationId: generation.id,
      versionNumber,
      html: target.html,
      triggeredBy: 'restore',
    });
    await recordChatMessage({
      generationId: generation.id,
      role: 'system',
      content: `Restored from v${target.versionNumber} as v${versionNumber}.`,
      resultedInVersionId: newVersion.id,
    });

    let pngKey: string | undefined;
    try {
      const rendered = await renderHtmlToPng({
        html: target.html,
        format: generation.format,
        generationId: generation.id,
      });
      pngKey = rendered.pngKey;
    } catch (err) {
      logger.warn({ err, generationId }, 'PNG render failed during restore');
    }
    await updateGenerationCurrentHtml(generation.id, target.html, pngKey);
    revalidatePath(`/workspaces/${workspace.id}/generations/${generationId}`);
    return { ok: true, data: { versionNumber, versionId: newVersion.id } };
  } catch (err) {
    logger.error({ err, generationId }, 'restoreVersion failed');
    return { ok: false, error: 'Could not restore' };
  }
}

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
