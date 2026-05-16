import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { StorageAdapter, StorageListEntry, StoredFile } from './index';

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

  async list(prefix: string): Promise<StorageListEntry[]> {
    const dir = this.resolve(prefix);
    let entries: string[];
    try {
      entries = await fs.readdir(dir);
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') return [];
      throw err;
    }
    const out: StorageListEntry[] = [];
    for (const name of entries) {
      const full = path.join(dir, name);
      try {
        const stat = await fs.stat(full);
        if (!stat.isFile()) continue;
        out.push({
          key: `${prefix.replace(/\/$/, '')}/${name}`,
          size: stat.size,
          mtimeMs: stat.mtimeMs,
        });
      } catch {
        // Skip entries we can't stat (e.g. broken symlinks).
      }
    }
    return out.sort((a, b) => b.mtimeMs - a.mtimeMs);
  }
}
