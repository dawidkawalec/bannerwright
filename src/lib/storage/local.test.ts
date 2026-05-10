import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { LocalStorage } from './local';

describe('LocalStorage', () => {
  let root: string;
  let storage: LocalStorage;

  beforeEach(async () => {
    root = await fs.mkdtemp(path.join(os.tmpdir(), 'bw-storage-'));
    storage = new LocalStorage(root);
  });

  afterEach(async () => {
    await fs.rm(root, { recursive: true, force: true });
  });

  it('writes and reads bytes', async () => {
    const data = Buffer.from('hello');
    const result = await storage.put('foo/bar.txt', data, 'text/plain');
    expect(result.size).toBe(5);
    expect(result.contentType).toBe('text/plain');
    const back = await storage.get('foo/bar.txt');
    expect(back.toString()).toBe('hello');
  });

  it('exists() returns false then true', async () => {
    expect(await storage.exists('a.txt')).toBe(false);
    await storage.put('a.txt', Buffer.from('x'), 'text/plain');
    expect(await storage.exists('a.txt')).toBe(true);
  });

  it('delete() removes file', async () => {
    await storage.put('a.txt', Buffer.from('x'), 'text/plain');
    await storage.delete('a.txt');
    expect(await storage.exists('a.txt')).toBe(false);
  });

  it('rejects keys escaping root', async () => {
    await expect(
      storage.put('../escape.txt', Buffer.from('x'), 'text/plain'),
    ).rejects.toThrow(/escapes root/);
  });

  it('creates nested directories on put', async () => {
    await storage.put('a/b/c/d.txt', Buffer.from('x'), 'text/plain');
    expect(await storage.exists('a/b/c/d.txt')).toBe(true);
  });
});
