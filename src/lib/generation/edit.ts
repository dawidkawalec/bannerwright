import { generateContentStream } from '@/lib/ai/gemini';
import { assertWithinDailyCaps } from '@/lib/ai/limits';
import {
  buildEditHtmlContents,
  EDIT_HTML_SYSTEM,
} from '@/lib/ai/prompts/edit-html';
import {
  getGenerationForWorkspace,
  insertGenerationVersion,
  listChatMessages,
  nextVersionNumber,
  recordChatMessage,
  updateGenerationCurrentHtml,
} from '@/lib/db/queries/generations';
import { logger } from '@/lib/logger';
import { renderHtmlToPng } from '@/lib/renderer/render-png';
import { loadAttachments } from '@/lib/storage/attachments';

export type EditInput = {
  userId: string;
  workspaceId: string;
  generationId: string;
  instruction: string;
  /** Storage keys of inspiration images attached to this instruction. */
  attachmentKeys?: string[];
};

export type EditEvent =
  | { type: 'progress'; step: 'preparing' | 'generating_html' | 'rendering_png' }
  | { type: 'partial_html'; html: string }
  | {
      type: 'done';
      versionId: string;
      versionNumber: number;
      htmlFinal: string;
      pngUrl: string;
      tokens: { input: number; output: number };
      costUsd: number;
    }
  | { type: 'error'; message: string };

export async function runEdit(
  input: EditInput,
  emit: (e: EditEvent) => void,
): Promise<void> {
  const generation = await getGenerationForWorkspace(input.generationId, input.workspaceId);
  if (!generation) throw new Error('Generation not found');

  await assertWithinDailyCaps();

  emit({ type: 'progress', step: 'preparing' });
  const [history, inspirations] = await Promise.all([
    listChatMessages(generation.id),
    loadAttachments(generation.workspaceId, input.attachmentKeys),
  ]);

  emit({ type: 'progress', step: 'generating_html' });
  const stream = generateContentStream({
    model: 'gemini-3.1-pro-preview',
    operation: 'edit_html',
    workspaceId: generation.workspaceId,
    generationId: generation.id,
    systemInstruction: EDIT_HTML_SYSTEM,
    contents: buildEditHtmlContents({
      format: generation.format,
      currentHtml: generation.currentHtml,
      chatHistory: history,
      instruction: input.instruction,
      inspirations,
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
  emit({ type: 'partial_html', html: accumulated });

  const final = result?.value;
  if (!final) throw new Error('Edit produced no output');
  const cleanHtml = stripFences(final.text || accumulated);

  const versionNumber = await nextVersionNumber(generation.id);
  const version = await insertGenerationVersion({
    generationId: generation.id,
    versionNumber,
    html: cleanHtml,
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
    tokensUsed: final.outputTokens,
  });

  emit({ type: 'progress', step: 'rendering_png' });

  let pngKey: string | undefined;
  try {
    const rendered = await renderHtmlToPng({
      html: cleanHtml,
      format: generation.format,
      generationId: generation.id,
    });
    pngKey = rendered.pngKey;
    await updateGenerationCurrentHtml(generation.id, cleanHtml, pngKey);
  } catch (err) {
    logger.error({ err, generationId: generation.id }, 'PNG render failed during edit');
    await updateGenerationCurrentHtml(generation.id, cleanHtml);
  }

  emit({
    type: 'done',
    versionId: version.id,
    versionNumber,
    htmlFinal: cleanHtml,
    pngUrl: `/api/generations/${generation.id}/png?v=${version.id}`,
    tokens: { input: final.inputTokens, output: final.outputTokens },
    costUsd: final.costUsd,
  });
}

function stripFences(text: string): string {
  const trimmed = text.trim();
  const fenceMatch = trimmed.match(/^```(?:html)?\s*([\s\S]*?)```$/i);
  return fenceMatch ? fenceMatch[1]!.trim() : trimmed;
}
