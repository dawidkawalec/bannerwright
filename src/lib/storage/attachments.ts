import { randomBytes } from 'node:crypto';
import { getStorage } from './index';
import { logger } from '@/lib/logger';

/** Allowed MIME types for AI inspiration attachments. */
export const ALLOWED_ATTACHMENT_TYPES = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'image/gif',
] as const;

export type AttachmentMime = (typeof ALLOWED_ATTACHMENT_TYPES)[number];

export const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024; // 5 MB / image
export const MAX_ATTACHMENTS_PER_REQUEST = 5;

export type SavedAttachment = {
  /** Storage key (relative path) — pass back to the server later. */
  key: string;
  mimeType: string;
  size: number;
};

export function isAllowedAttachmentType(type: string): type is AttachmentMime {
  return (ALLOWED_ATTACHMENT_TYPES as readonly string[]).includes(type);
}

function extFor(mime: string): string {
  switch (mime) {
    case 'image/png':
      return 'png';
    case 'image/jpeg':
    case 'image/jpg':
      return 'jpg';
    case 'image/webp':
      return 'webp';
    case 'image/gif':
      return 'gif';
    default:
      return 'bin';
  }
}

/**
 * Persist a single user-uploaded image into per-workspace attachment storage.
 * Returns the canonical storage key the server can later resolve via
 * {@link loadAttachments}.
 */
export async function saveAttachment(
  workspaceId: string,
  file: File,
): Promise<SavedAttachment> {
  if (!isAllowedAttachmentType(file.type)) {
    throw new Error(`Unsupported file type: ${file.type || 'unknown'}`);
  }
  if (file.size === 0) {
    throw new Error('Empty file');
  }
  if (file.size > MAX_ATTACHMENT_BYTES) {
    throw new Error(
      `File too large (${(file.size / 1024 / 1024).toFixed(1)} MB > ${
        MAX_ATTACHMENT_BYTES / 1024 / 1024
      } MB)`,
    );
  }

  const nonce = randomBytes(8).toString('hex');
  const key = `workspaces/${workspaceId}/attachments/${Date.now()}-${nonce}.${extFor(file.type)}`;
  const buf = Buffer.from(await file.arrayBuffer());
  await getStorage().put(key, buf, file.type);
  return { key, mimeType: file.type, size: buf.byteLength };
}

/**
 * Load previously-uploaded attachments by storage key. Returns the raw bytes
 * plus the inferred mime type (from the file extension since we don't store
 * metadata). Missing keys are skipped with a warning.
 */
export async function loadAttachments(
  workspaceId: string,
  keys: string[] | undefined | null,
): Promise<{ mimeType: string; bytes: Buffer }[]> {
  if (!keys || keys.length === 0) return [];
  const storage = getStorage();
  const out: { mimeType: string; bytes: Buffer }[] = [];
  for (const key of keys.slice(0, MAX_ATTACHMENTS_PER_REQUEST)) {
    if (!key.startsWith(`workspaces/${workspaceId}/attachments/`)) {
      logger.warn({ key, workspaceId }, 'attachment key not in workspace scope, skipping');
      continue;
    }
    try {
      const bytes = await storage.get(key);
      out.push({ mimeType: mimeFromKey(key), bytes });
    } catch (err) {
      logger.warn({ err, key }, 'attachment missing, skipping');
    }
  }
  return out;
}

function mimeFromKey(key: string): string {
  const ext = key.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'png':
      return 'image/png';
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'webp':
      return 'image/webp';
    case 'gif':
      return 'image/gif';
    default:
      return 'application/octet-stream';
  }
}
