import { generateContentStream } from '@/lib/ai/gemini';
import {
  buildGenerateHtmlContents,
  GENERATE_HTML_SYSTEM,
} from '@/lib/ai/prompts/generate-html';
import {
  insertGeneration,
  insertGenerationVersion,
  recordChatMessage,
  updateGenerationCurrentHtml,
} from '@/lib/db/queries/generations';
import { listKbSourcesByWorkspace } from '@/lib/db/queries/kb';
import { getWorkspaceForUser } from '@/lib/db/queries/workspaces';
import type { GenerationFormat } from '@/lib/db/schema';
import { logger } from '@/lib/logger';
import { renderHtmlToPng } from '@/lib/renderer/render-png';
import { getStorage } from '@/lib/storage';

export type RunInput = {
  userId: string;
  workspaceId: string;
  format: GenerationFormat;
  brief: string;
  title?: string;
};

export type StreamEvent =
  | { type: 'progress'; step: 'analyzing_kb' | 'generating_html' | 'rendering_png' }
  | { type: 'partial_html'; html: string }
  | {
      type: 'done';
      generationId: string;
      versionId: string;
      htmlFinal: string;
      pngUrl: string;
      tokens: { input: number; output: number };
      costUsd: number;
    }
  | { type: 'error'; message: string };

const MAX_KB_FOR_PROMPT = 5;
const MAX_SCREENSHOTS = 3;

/**
 * Drives a full generation: build context → stream HTML → persist → render PNG.
 * Emits {@link StreamEvent}s via the supplied `emit` callback. Throws on
 * unrecoverable errors (caller is responsible for emitting `error` and closing
 * the SSE stream).
 */
export async function runGeneration(
  input: RunInput,
  emit: (e: StreamEvent) => void,
): Promise<void> {
  const workspace = await getWorkspaceForUser(input.workspaceId, input.userId);
  if (!workspace) throw new Error('Workspace not found');

  emit({ type: 'progress', step: 'analyzing_kb' });

  const allSources = await listKbSourcesByWorkspace(workspace.id);
  const ready = allSources.filter((s) => s.status === 'ready').slice(0, MAX_KB_FOR_PROMPT);

  // Pull screenshots for top URL sources.
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

  emit({ type: 'progress', step: 'generating_html' });

  const stream = generateContentStream({
    model: 'gemini-3.1-pro-preview',
    operation: 'generate_html',
    workspaceId: workspace.id,
    systemInstruction: GENERATE_HTML_SYSTEM,
    contents: buildGenerateHtmlContents({
      format: input.format,
      brief: input.brief,
      brandColors: workspace.brandColors,
      brandFonts: workspace.brandFonts,
      kb: ready.map((s) => ({ title: s.title, url: s.url, contentText: s.contentText })),
      screenshots,
    }),
  });

  let accumulated = '';
  let lastEmitAt = 0;
  let result: Awaited<ReturnType<typeof stream.next>> | undefined;
  while (true) {
    result = await stream.next();
    if (result.done) break;
    accumulated += result.value;
    const now = Date.now();
    if (now - lastEmitAt > 200) {
      emit({ type: 'partial_html', html: accumulated });
      lastEmitAt = now;
    }
  }

  // Final partial in case last burst was within 200ms window.
  emit({ type: 'partial_html', html: accumulated });

  const final = result?.value;
  if (!final) throw new Error('Generation produced no output');
  const cleanHtml = stripFences(final.text || accumulated);

  // Persist generation + version + chat message.
  const generation = await insertGeneration({
    workspaceId: workspace.id,
    title: input.title?.slice(0, 120) || deriveTitle(input.brief),
    format: input.format,
    currentHtml: cleanHtml,
    brief: input.brief,
  });
  const version = await insertGenerationVersion({
    generationId: generation.id,
    versionNumber: 1,
    html: cleanHtml,
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
    tokensUsed: final.outputTokens,
  });

  emit({ type: 'progress', step: 'rendering_png' });

  let pngKey: string | undefined;
  try {
    const rendered = await renderHtmlToPng({
      html: cleanHtml,
      format: input.format,
      generationId: generation.id,
    });
    pngKey = rendered.pngKey;
    await updateGenerationCurrentHtml(generation.id, cleanHtml, pngKey);
  } catch (err) {
    logger.error({ err, generationId: generation.id }, 'PNG render failed');
    // Non-fatal — user can manually re-render later.
  }

  emit({
    type: 'done',
    generationId: generation.id,
    versionId: version.id,
    htmlFinal: cleanHtml,
    pngUrl: `/api/generations/${generation.id}/png`,
    tokens: { input: final.inputTokens, output: final.outputTokens },
    costUsd: final.costUsd,
  });
}

function stripFences(text: string): string {
  // Defensive: model occasionally wraps the doc in ```html fences despite the prompt.
  const trimmed = text.trim();
  const fenceMatch = trimmed.match(/^```(?:html)?\s*([\s\S]*?)```$/i);
  return fenceMatch ? fenceMatch[1]!.trim() : trimmed;
}

function deriveTitle(brief: string): string {
  return brief
    .replace(/[\n\r]+/g, ' ')
    .slice(0, 80)
    .trim() || 'Untitled banner';
}
