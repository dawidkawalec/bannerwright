import { env } from '../env';
import { LocalStorage } from './local';

export type StoredFile = {
  /** Storage-relative key, e.g. "workspaces/{id}/uploads/foo.png" */
  key: string;
  /** Bytes written. */
  size: number;
  /** Detected/declared MIME type. */
  contentType: string;
};

export type StorageListEntry = {
  key: string;
  size: number;
  mtimeMs: number;
};

export interface StorageAdapter {
  put(key: string, data: Buffer | Uint8Array, contentType: string): Promise<StoredFile>;
  get(key: string): Promise<Buffer>;
  exists(key: string): Promise<boolean>;
  delete(key: string): Promise<void>;
  /** Resolve to an absolute URL or filesystem path the renderer can read. */
  resolveUrl(key: string): string;
  /** Enumerate files under a key prefix (non-recursive). */
  list(prefix: string): Promise<StorageListEntry[]>;
}

let _storage: StorageAdapter | undefined;

export function getStorage(): StorageAdapter {
  if (_storage) return _storage;
  switch (env.STORAGE_DRIVER) {
    case 'local':
      _storage = new LocalStorage(env.STORAGE_PATH);
      return _storage;
    case 's3':
      throw new Error('S3 adapter not implemented in MVP — set STORAGE_DRIVER=local');
    default:
      throw new Error(`Unknown STORAGE_DRIVER: ${env.STORAGE_DRIVER as string}`);
  }
}

export const storageKeys = {
  workspaceLogo: (workspaceId: string, ext: string) =>
    `workspaces/${workspaceId}/uploads/logo.${ext}`,
  workspaceUpload: (workspaceId: string, filename: string) =>
    `workspaces/${workspaceId}/uploads/${filename}`,
  kbScreenshot: (workspaceId: string, sourceId: string) =>
    `workspaces/${workspaceId}/screenshots/${sourceId}.png`,
  generated: (workspaceId: string, name: string) =>
    `workspaces/${workspaceId}/generated/${name}`,
  generationPng: (generationId: string) => `generations/${generationId}.png`,
  generationVersionPng: (generationId: string, versionId: string) =>
    `generations/${generationId}/versions/${versionId}.png`,
};
