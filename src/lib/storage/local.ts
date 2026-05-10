import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { StorageAdapter, StoredFile } from './index';

export class LocalStorage implements StorageAdapter {
  constructor(private readonly root: string) {}

  private resolve(key: string) {
    const rootAbs = path.resolve(this.root);
    const target = path.resolve(rootAbs, key);
    const rel = path.relative(rootAbs, target);
    if (rel.startsWith('..') || path.isAbsolute(rel)) {
      throw new Error(`Storage key escapes root: ${key}`);
    }
    return target;
  }

  async put(
    key: string,
    data: Buffer | Uint8Array,
    contentType: string,
  ): Promise<StoredFile> {
    const target = this.resolve(key);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, data);
    const stat = await fs.stat(target);
    return { key, size: stat.size, contentType };
  }

  async get(key: string): Promise<Buffer> {
    const target = this.resolve(key);
    return fs.readFile(target);
  }

  async exists(key: string): Promise<boolean> {
    try {
      await fs.access(this.resolve(key));
      return true;
    } catch {
      return false;
    }
  }

  async delete(key: string): Promise<void> {
    const target = this.resolve(key);
    await fs.rm(target, { force: true });
  }

  resolveUrl(key: string): string {
    return path.resolve(this.resolve(key));
  }
}
