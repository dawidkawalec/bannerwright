import { and, asc, desc, eq, max } from 'drizzle-orm';
import { db } from '../client';
import {
  chatMessages,
  generations,
  generationVersions,
  type ChatMessage,
  type Generation,
  type GenerationVersion,
  type NewGeneration,
} from '../schema';
import type { BannerTree } from '../../tree/types';

export async function listGenerationsByWorkspace(
  workspaceId: string,
): Promise<Generation[]> {
  return db
    .select()
    .from(generations)
    .where(eq(generations.workspaceId, workspaceId))
    .orderBy(desc(generations.updatedAt));
}

export async function listTemplatesByWorkspace(
  workspaceId: string,
): Promise<Generation[]> {
  return db
    .select()
    .from(generations)
    .where(and(eq(generations.workspaceId, workspaceId), eq(generations.isTemplate, true)))
    .orderBy(desc(generations.updatedAt));
}

export async function setTemplateFlag(
  id: string,
  workspaceId: string,
  isTemplate: boolean,
  templateName?: string | null,
): Promise<Generation | null> {
  const [row] = await db
    .update(generations)
    .set({
      isTemplate,
      templateName: isTemplate ? (templateName ?? null) : null,
      updatedAt: new Date(),
    })
    .where(and(eq(generations.id, id), eq(generations.workspaceId, workspaceId)))
    .returning();
  return row ?? null;
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
  /** Required for legacy versions; null for tree-only versions. */
  html?: string | null;
  /** Required for tree versions; null for legacy versions. */
  tree?: BannerTree | null;
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

/**
 * Update the typed banner tree (source of truth for new banners) and the
 * derived HTML cache used for the PNG render endpoint.
 */
export async function updateGenerationCurrentTree(
  id: string,
  tree: BannerTree,
  htmlCache: string,
  pngPath?: string,
): Promise<void> {
  await db
    .update(generations)
    .set({
      currentTree: tree,
      currentHtml: htmlCache,
      currentPngPath: pngPath,
      updatedAt: new Date(),
    })
    .where(eq(generations.id, id));
}

export async function listChatMessages(
  generationId: string,
): Promise<ChatMessage[]> {
  return db
    .select()
    .from(chatMessages)
    .where(eq(chatMessages.generationId, generationId))
    .orderBy(asc(chatMessages.createdAt));
}

export async function nextVersionNumber(generationId: string): Promise<number> {
  const [row] = await db
    .select({ max: max(generationVersions.versionNumber) })
    .from(generationVersions)
    .where(eq(generationVersions.generationId, generationId));
  return (row?.max ?? 0) + 1;
}

export async function getVersion(id: string): Promise<GenerationVersion | null> {
  const [row] = await db.select().from(generationVersions).where(eq(generationVersions.id, id));
  return row ?? null;
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
