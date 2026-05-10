'use server';

import { revalidatePath } from 'next/cache';
import { requireUser } from '@/lib/auth/current-user';
import { getWorkspaceForUser } from '@/lib/db/queries/workspaces';
import {
  deleteKbSourceById,
  getKbSourceForWorkspace,
  insertKbSourceText,
  insertKbSourceUpload,
  insertKbSourceUrl,
} from '@/lib/db/queries/kb';
import { processKbUrl } from '@/lib/kb/process-url';
import { logger } from '@/lib/logger';
import {
  addKbTextSchema,
  addKbUrlSchema,
  ALLOWED_KB_IMAGE_TYPES,
  ALLOWED_KB_TEXT_TYPES,
  ALLOWED_KB_UPLOAD_TYPES,
  MAX_KB_TEXT_BYTES,
  MAX_KB_UPLOAD_BYTES,
} from '@/lib/schemas/kb';
import { getStorage, storageKeys } from '@/lib/storage';
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

export async function addKbSourceText(
  workspaceId: string,
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const parsed = addKbTextSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }
  const user = await requireUser();
  const workspace = await getWorkspaceForUser(workspaceId, user.id);
  if (!workspace) return { ok: false, error: 'Workspace not found' };

  try {
    const source = await insertKbSourceText(workspace.id, parsed.data.title, parsed.data.text);
    revalidatePath(`/workspaces/${workspace.id}/knowledge-base`);
    return { ok: true, data: { id: source.id } };
  } catch (err) {
    logger.error({ err }, 'addKbSourceText failed');
    return { ok: false, error: 'Could not add text source' };
  }
}

export async function addKbSourceUpload(
  workspaceId: string,
  formData: FormData,
): Promise<ActionResult<{ id: string; kind: 'text' | 'image' }>> {
  const user = await requireUser();
  const workspace = await getWorkspaceForUser(workspaceId, user.id);
  if (!workspace) return { ok: false, error: 'Workspace not found' };

  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: 'No file uploaded' };
  }
  if (file.size > MAX_KB_UPLOAD_BYTES) {
    return {
      ok: false,
      error: `File too large (${(file.size / 1024 / 1024).toFixed(1)} MB > ${
        MAX_KB_UPLOAD_BYTES / 1024 / 1024
      } MB)`,
    };
  }

  let detectedType = file.type;
  // Some browsers don't supply MIME for .md / .txt — fall back to extension.
  if (!detectedType || detectedType === 'application/octet-stream') {
    const lowered = file.name.toLowerCase();
    if (lowered.endsWith('.md') || lowered.endsWith('.markdown'))
      detectedType = 'text/markdown';
    else if (lowered.endsWith('.txt')) detectedType = 'text/plain';
  }
  if (!isAllowedKbUpload(detectedType)) {
    return {
      ok: false,
      error: 'Supported formats: TXT, MD, PNG, JPEG, WebP. PDF coming soon.',
    };
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const safeName = sanitiseFilename(file.name);
  const key = storageKeys.workspaceUpload(workspaceId, `${Date.now()}-${safeName}`);

  try {
    await getStorage().put(key, buf, detectedType);
  } catch (err) {
    logger.error({ err }, 'kb upload write failed');
    return { ok: false, error: 'Could not save file' };
  }

  const isText = (ALLOWED_KB_TEXT_TYPES as readonly string[]).includes(detectedType);
  const isImage = (ALLOWED_KB_IMAGE_TYPES as readonly string[]).includes(detectedType);

  let contentText: string | undefined;
  if (isText) {
    const raw = buf.toString('utf-8').slice(0, MAX_KB_TEXT_BYTES);
    contentText = raw;
  }

  try {
    const source = await insertKbSourceUpload(workspaceId, {
      title: file.name,
      filePath: key,
      kind: isText ? 'text' : 'image',
      contentText,
      // Reuse the existing screenshot pipeline for thumbnail rendering — the
      // KbSourceRow component already renders /api/kb/{id}/screenshot.
      screenshotPath: isImage ? key : undefined,
      metadata: { mimeType: detectedType, originalName: file.name, sizeBytes: file.size },
    });
    revalidatePath(`/workspaces/${workspace.id}/knowledge-base`);
    return { ok: true, data: { id: source.id, kind: isText ? 'text' : 'image' } };
  } catch (err) {
    logger.error({ err }, 'addKbSourceUpload failed');
    // Best-effort cleanup of the orphaned blob.
    await getStorage()
      .delete(key)
      .catch(() => {});
    return { ok: false, error: 'Could not save source' };
  }
}

function isAllowedKbUpload(type: string): boolean {
  return (ALLOWED_KB_UPLOAD_TYPES as readonly string[]).includes(type);
}

function sanitiseFilename(name: string): string {
  return name
    .replace(/[^\w.\- ]+/g, '_')
    .replace(/\s+/g, '_')
    .slice(0, 80);
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
