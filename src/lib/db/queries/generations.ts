import { and, desc, eq } from 'drizzle-orm';
import { db } from '../client';
import {
  chatMessages,
  generations,
  generationVersions,
  type Generation,
  type GenerationVersion,
  type NewGeneration,
} from '../schema';

export async function listGenerationsByWorkspace(
  workspaceId: string,
): Promise<Generation[]> {
  return db
    .select()
    .from(generations)
    .where(eq(generations.workspaceId, workspaceId))
    .orderBy(desc(generations.updatedAt));
}

export async function getGeneration(id: string): Promise<Generation | null> {
  const [row] = await db.select().from(generations).where(eq(generations.id, id));
  return row ?? null;
}

export async function getGenerationForWorkspace(
  id: string,
  workspaceId: string,
): Promise<Generation | null> {
  const [row] = await db
    .select()
    .from(generations)
    .where(and(eq(generations.id, id), eq(generations.workspaceId, workspaceId)));
  return row ?? null;
}

export async function listVersionsByGeneration(
  generationId: string,
): Promise<GenerationVersion[]> {
  return db
    .select()
    .from(generationVersions)
    .where(eq(generationVersions.generationId, generationId))
    .orderBy(desc(generationVersions.versionNumber));
}

export async function insertGeneration(values: NewGeneration): Promise<Generation> {
  const [row] = await db.insert(generations).values(values).returning();
  return row!;
}

export async function insertGenerationVersion(values: {
  generationId: string;
  versionNumber: number;
  html: string;
  triggeredBy: GenerationVersion['triggeredBy'];
  aiPrompt?: string;
  pngPath?: string;
}): Promise<GenerationVersion> {
  const [row] = await db.insert(generationVersions).values(values).returning();
  return row!;
}

export async function recordChatMessage(values: {
  generationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  resultedInVersionId?: string;
  tokensUsed?: number;
}): Promise<void> {
  await db.insert(chatMessages).values(values);
}

export async function updateGenerationCurrentHtml(
  id: string,
  html: string,
  pngPath?: string,
): Promise<void> {
  await db
    .update(generations)
    .set({ currentHtml: html, currentPngPath: pngPath, updatedAt: new Date() })
    .where(eq(generations.id, id));
}

export async function deleteGenerationById(
  id: string,
  workspaceId: string,
): Promise<boolean> {
  const result = await db
    .delete(generations)
    .where(and(eq(generations.id, id), eq(generations.workspaceId, workspaceId)))
    .returning({ id: generations.id });
  return result.length > 0;
}
