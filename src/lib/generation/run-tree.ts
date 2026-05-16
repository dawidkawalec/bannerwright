import { generateContent } from '@/lib/ai/gemini';
import { assertWithinDailyCaps } from '@/lib/ai/limits';
import {
  buildGenerateTreeContents,
  GENERATE_TREE_SYSTEM,
} from '@/lib/ai/prompts/generate-tree';
import {
  insertGeneration,
  insertGenerationVersion,
  recordChatMessage,
  updateGenerationCurrentTree,
} from '@/lib/db/queries/generations';
import { listKbSourcesByWorkspace } from '@/lib/db/queries/kb';
import { getWorkspaceForUser } from '@/lib/db/queries/workspaces';
import type { GenerationFormat } from '@/lib/db/schema';
import { logger } from '@/lib/logger';
import { renderHtmlToPng } from '@/lib/renderer/render-png';
import { getStorage } from '@/lib/storage';
import { loadAttachments } from '@/lib/storage/attachments';
import { applyTreeDefaults } from '@/lib/tree/defaults';
import { bannerTreeSchema } from '@/lib/tree/schema';
import { renderTreeToHtml } from '@/lib/tree/render-html';
import { BANNER_TREE_JSON_SCHEMA } from '@/lib/tree/json-schema';
import type { BannerTree } from '@/lib/tree/types';

export type RunTreeInput = {
  userId: string;
  workspaceId: string;
  format: GenerationFormat;
  brief: string;
  title?: string;
  attachmentKeys?: string[];
};

export type RunTreeEvent =
  | { type: 'progress'; step: 'analyzing_kb' | 'generating_tree' | 'rendering_png' }
  | {
      type: 'done';
      generationId: string;
      versionId: string;
      tree: BannerTree;
      /** Server-rendered HTML cache for the live preview compatibility. */
      htmlFinal: string;
      pngUrl: string;
      tokens: { input: number; output: number };
      costUsd: number;
    }
  | { type: 'error'; message: string };

const MAX_KB_FOR_PROMPT = 5;
const MAX_SCREENSHOTS = 3;
const MAX_RETRIES = 2;

/**
 * Drives a full tree-based generation: build context → call Gemini structured
 * output → validate → persist → render PNG. No streaming for MVP — the JSON
 * payload is small (~3–8 KB) and total latency is acceptable.
 */
export async function runTreeGeneration(
  input: RunTreeInput,
  emit: (e: RunTreeEvent) => void,
): Promise<void> {
  const workspace = await getWorkspaceForUser(input.workspaceId, input.userId);
  if (!workspace) throw new Error('Workspace not found');

  await assertWithinDailyCaps({ newGeneration: true });

  emit({ type: 'progress', step: 'analyzing_kb' });

  const allSources = await listKbSourcesByWorkspace(workspace.id);
  const ready = allSources.filter((s) => s.status === 'ready').slice(0, MAX_KB_FOR_PROMPT);

  const storage = getStorage();
  const screenshots: { mimeType: string; bytes: Buffer }[] = [];
  for (const src of ready) {
    if (screenshots.length >= MAX_SCREENSHOTS) break;
    if (src.screenshotPath) {
      try {
        const bytes = await storage.get(src.screenshotPath);
        screenshots.push({ mimeType: 'image/png', bytes });
      } catch (err) {
        logger.warn({ err, key: src.screenshotPath }, 'screenshot missing for prompt');
      }
    }
  }

  const inspirations = await loadAttachments(workspace.id, input.attachmentKeys);

  emit({ type: 'progress', step: 'generating_tree' });

  const tree = await generateValidatedTree({
    workspaceId: workspace.id,
    promptInput: {
      format: input.format,
      brief: input.brief,
      brandColors: workspace.brandColors,
      brandFonts: workspace.brandFonts,
      kb: ready.map((s) => ({ title: s.title, url: s.url, contentText: s.contentText })),
      screenshots,
      inspirations,
    },
  });

  const htmlCache = renderTreeToHtml(tree);

  const generation = await insertGeneration({
    workspaceId: workspace.id,
    title: input.title?.slice(0, 120) || deriveTitle(input.brief),
    format: input.format,
    currentTree: tree,
    currentHtml: htmlCache,
    brief: input.brief,
  });
  const version = await insertGenerationVersion({
    generationId: generation.id,
    versionNumber: 1,
    tree,
    html: htmlCache,
    triggeredBy: 'initial_generation',
  });
  await recordChatMessage({
    generationId: generation.id,
    role: 'user',
    content: input.brief,
  });
  await recordChatMessage({
    generationId: generation.id,
    role: 'assistant',
    content: 'Initial banner generated.',
    resultedInVersionId: version.id,
  });

  emit({ type: 'progress', step: 'rendering_png' });

  let pngKey: string | undefined;
  try {
    const rendered = await renderHtmlToPng({
      tree,
      format: input.format,
      generationId: generation.id,
    });
    pngKey = rendered.pngKey;
    await updateGenerationCurrentTree(generation.id, tree, htmlCache, pngKey);
  } catch (err) {
    logger.error({ err, generationId: generation.id }, 'PNG render failed (tree)');
  }

  emit({
    type: 'done',
    generationId: generation.id,
    versionId: version.id,
    tree,
    htmlFinal: htmlCache,
    pngUrl: `/api/generations/${generation.id}/png`,
    tokens: { input: 0, output: 0 },
    costUsd: 0,
  });
}

type GenerateValidatedInput = {
  workspaceId: string;
  promptInput: Parameters<typeof buildGenerateTreeContents>[0];
};

async function generateValidatedTree({
  workspaceId,
  promptInput,
}: GenerateValidatedInput): Promise<BannerTree> {
  let lastError: string | undefined;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const contents = lastError
      ? appendRetryFeedback(buildGenerateTreeContents(promptInput), lastError)
      : buildGenerateTreeContents(promptInput);

    const result = await generateContent({
      model: 'gemini-3.1-pro-preview',
      operation: 'generate_html',
      workspaceId,
      systemInstruction: GENERATE_TREE_SYSTEM,
      contents,
      responseSchema: BANNER_TREE_JSON_SCHEMA,
    });

    try {
      const raw = JSON.parse(stripFences(result.text));
      const tree = bannerTreeSchema.parse(applyTreeDefaults(raw));
      if (!tree.root.children || tree.root.children.length === 0) {
        throw new Error(
          'Root frame has no children — banners must contain at least a headline and one supporting element. Generate a real banner with 5–10 nodes.',
        );
      }
      return tree;
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
      logger.warn({ attempt, lastError }, 'tree validation failed; retrying');
    }
  }
  throw new Error(`Tree generation failed after ${MAX_RETRIES + 1} attempts: ${lastError}`);
}

function appendRetryFeedback(contents: ReturnType<typeof buildGenerateTreeContents>, err: string) {
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

function deriveTitle(brief: string): string {
  return brief.replace(/[\n\r]+/g, ' ').slice(0, 80).trim() || 'Untitled banner';
}
