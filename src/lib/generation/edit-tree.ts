import { generateContent } from '@/lib/ai/gemini';
import { assertWithinDailyCaps } from '@/lib/ai/limits';
import {
  buildEditTreeContents,
  EDIT_TREE_SYSTEM,
} from '@/lib/ai/prompts/edit-tree';
import {
  getGenerationForWorkspace,
  insertGenerationVersion,
  listChatMessages,
  nextVersionNumber,
  recordChatMessage,
  updateGenerationCurrentTree,
} from '@/lib/db/queries/generations';
import { logger } from '@/lib/logger';
import { renderHtmlToPng } from '@/lib/renderer/render-png';
import { loadAttachments } from '@/lib/storage/attachments';
import { applyTreeDefaults } from '@/lib/tree/defaults';
import { BANNER_TREE_JSON_SCHEMA } from '@/lib/tree/json-schema';
import { bannerTreeSchema } from '@/lib/tree/schema';
import { idSurvivalRatio } from '@/lib/tree/operations';
import { renderTreeToHtml } from '@/lib/tree/render-html';
import type { BannerTree } from '@/lib/tree/types';

export type EditTreeInput = {
  userId: string;
  workspaceId: string;
  generationId: string;
  instruction: string;
  attachmentKeys?: string[];
};

export type EditTreeEvent =
  | { type: 'progress'; step: 'preparing' | 'generating_tree' | 'rendering_png' }
  | {
      type: 'done';
      versionId: string;
      versionNumber: number;
      tree: BannerTree;
      htmlFinal: string;
      pngUrl: string;
      idSurvival: number;
      tokens: { input: number; output: number };
      costUsd: number;
    }
  | { type: 'error'; message: string };

const MAX_RETRIES = 2;

export async function runTreeEdit(
  input: EditTreeInput,
  emit: (e: EditTreeEvent) => void,
): Promise<void> {
  const generation = await getGenerationForWorkspace(input.generationId, input.workspaceId);
  if (!generation) throw new Error('Generation not found');
  if (!generation.currentTree) {
    throw new Error('Generation has no tree (legacy banner — use HTML edit endpoint)');
  }
  const currentTree = generation.currentTree;

  await assertWithinDailyCaps();

  emit({ type: 'progress', step: 'preparing' });
  const [history, inspirations] = await Promise.all([
    listChatMessages(generation.id),
    loadAttachments(generation.workspaceId, input.attachmentKeys),
  ]);

  emit({ type: 'progress', step: 'generating_tree' });

  let lastError: string | undefined;
  let attempt = 0;
  let tree: BannerTree | null = null;
  let tokens = { input: 0, output: 0 };
  let costUsd = 0;
  while (attempt <= MAX_RETRIES) {
    const baseContents = buildEditTreeContents({
      format: generation.format,
      currentTree,
      chatHistory: history,
      instruction: input.instruction,
      inspirations,
    });
    const contents = lastError ? appendRetryFeedback(baseContents, lastError) : baseContents;

    const result = await generateContent({
      model: 'gemini-3.1-pro-preview',
      operation: 'edit_html',
      workspaceId: generation.workspaceId,
      generationId: generation.id,
      systemInstruction: EDIT_TREE_SYSTEM,
      contents,
      responseSchema: BANNER_TREE_JSON_SCHEMA,
    });
    tokens = { input: result.inputTokens, output: result.outputTokens };
    costUsd = result.costUsd;

    try {
      const raw = JSON.parse(stripFences(result.text));
      tree = bannerTreeSchema.parse(applyTreeDefaults(raw));
      break;
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
      logger.warn({ attempt, lastError, generationId: generation.id }, 'tree edit validation failed; retrying');
      attempt++;
    }
  }
  if (!tree) {
    throw new Error(`Tree edit failed after ${MAX_RETRIES + 1} attempts: ${lastError}`);
  }
  const newTree = tree;

  const survival = idSurvivalRatio(currentTree, newTree);
  if (survival < 0.3) {
    logger.warn(
      { generationId: generation.id, survival },
      'tree edit lost most IDs — treating as full rewrite',
    );
  }

  const htmlCache = renderTreeToHtml(newTree);

  const versionNumber = await nextVersionNumber(generation.id);
  const version = await insertGenerationVersion({
    generationId: generation.id,
    versionNumber,
    tree: newTree,
    html: htmlCache,
    triggeredBy: 'ai_edit',
    aiPrompt: input.instruction,
  });
  await recordChatMessage({
    generationId: generation.id,
    role: 'user',
    content: input.instruction,
  });
  await recordChatMessage({
    generationId: generation.id,
    role: 'assistant',
    content: `Updated to v${versionNumber}.`,
    resultedInVersionId: version.id,
    tokensUsed: tokens.output,
  });

  emit({ type: 'progress', step: 'rendering_png' });

  let pngKey: string | undefined;
  try {
    const rendered = await renderHtmlToPng({
      tree: newTree,
      format: generation.format,
      generationId: generation.id,
    });
    pngKey = rendered.pngKey;
    await updateGenerationCurrentTree(generation.id, newTree, htmlCache, pngKey);
  } catch (err) {
    logger.error({ err, generationId: generation.id }, 'PNG render failed (tree edit)');
    await updateGenerationCurrentTree(generation.id, newTree, htmlCache);
  }

  emit({
    type: 'done',
    versionId: version.id,
    versionNumber,
    tree: newTree,
    htmlFinal: htmlCache,
    pngUrl: `/api/generations/${generation.id}/png?v=${version.id}`,
    idSurvival: survival,
    tokens,
    costUsd,
  });
}

function appendRetryFeedback(contents: ReturnType<typeof buildEditTreeContents>, err: string) {
  const last = contents[contents.length - 1];
  if (!last) return contents;
  return [
    ...contents.slice(0, -1),
    {
      ...last,
      parts: [
        ...(last.parts ?? []),
        {
          text: `\nPrevious attempt failed validation: ${err}\nProduce a fresh JSON document that satisfies the schema.`,
        },
      ],
    },
  ];
}

function stripFences(text: string): string {
  const trimmed = text.trim();
  const fenceMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)```$/i);
  return fenceMatch ? fenceMatch[1]!.trim() : trimmed;
}
