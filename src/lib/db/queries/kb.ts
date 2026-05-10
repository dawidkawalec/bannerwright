import { and, desc, eq } from 'drizzle-orm';
import { db } from '../client';
import { kbSources, type KbSource } from '../schema';

export async function listKbSourcesByWorkspace(workspaceId: string): Promise<KbSource[]> {
  return db
    .select()
    .from(kbSources)
    .where(eq(kbSources.workspaceId, workspaceId))
    .orderBy(desc(kbSources.createdAt));
}

export async function getKbSource(id: string): Promise<KbSource | null> {
  const [row] = await db.select().from(kbSources).where(eq(kbSources.id, id));
  return row ?? null;
}

export async function getKbSourceForWorkspace(
  id: string,
  workspaceId: string,
): Promise<KbSource | null> {
  const [row] = await db
    .select()
    .from(kbSources)
    .where(and(eq(kbSources.id, id), eq(kbSources.workspaceId, workspaceId)));
  return row ?? null;
}

export async function insertKbSourceUrl(
  workspaceId: string,
  url: string,
): Promise<KbSource> {
  const [row] = await db
    .insert(kbSources)
    .values({
      workspaceId,
      sourceType: 'url',
      title: url,
      url,
      status: 'pending',
    })
    .returning();
  return row!;
}

export async function insertKbSourceText(
  workspaceId: string,
  title: string,
  text: string,
): Promise<KbSource> {
  const [row] = await db
    .insert(kbSources)
    .values({
      workspaceId,
      sourceType: 'text',
      title,
      contentText: text,
      status: 'ready',
      processedAt: new Date(),
    })
    .returning();
  return row!;
}

export type KbStatusUpdate = {
  status: 'processing' | 'ready' | 'failed';
  contentText?: string;
  screenshotPath?: string;
  metadata?: Record<string, unknown>;
  errorMessage?: string;
  title?: string;
  processedAt?: Date | null;
};

export async function updateKbStatus(
  id: string,
  patch: KbStatusUpdate,
): Promise<void> {
  await db
    .update(kbSources)
    .set({
      status: patch.status,
      contentText: patch.contentText,
      screenshotPath: patch.screenshotPath,
      metadata: patch.metadata as never,
      errorMessage: patch.errorMessage,
      title: patch.title,
      processedAt: patch.processedAt,
    })
    .where(eq(kbSources.id, id));
}

export async function deleteKbSourceById(id: string, workspaceId: string): Promise<boolean> {
  const result = await db
    .delete(kbSources)
    .where(and(eq(kbSources.id, id), eq(kbSources.workspaceId, workspaceId)))
    .returning({ id: kbSources.id });
  return result.length > 0;
}
