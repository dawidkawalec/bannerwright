import { generateImage } from '@/lib/ai/gemini';
import { assertWithinDailyCaps } from '@/lib/ai/limits';
import {
  getGenerationForWorkspace,
  insertGenerationVersion,
  nextVersionNumber,
  recordChatMessage,
  updateGenerationCurrentHtml,
} from '@/lib/db/queries/generations';
import { logger } from '@/lib/logger';
import { renderHtmlToPng } from '@/lib/renderer/render-png';
import { getStorage, storageKeys } from '@/lib/storage';

export type BackgroundInput = {
  workspaceId: string;
  generationId: string;
  prompt: string;
};

export type BackgroundResult = {
  versionId: string;
  versionNumber: number;
  costUsd: number;
};

const BACKGROUND_PROMPT_PREFIX =
  'Photorealistic banner background image, large solid composition, balanced negative space for typography overlay. ';

export async function generateBannerBackground(
  input: BackgroundInput,
): Promise<BackgroundResult> {
  const generation = await getGenerationForWorkspace(input.generationId, input.workspaceId);
  if (!generation) throw new Error('Generation not found');

  await assertWithinDailyCaps();

  const { bytes, mimeType, costUsd } = await generateImage({
    model: 'gemini-3-pro-image-preview',
    operation: 'image_gen',
    workspaceId: input.workspaceId,
    generationId: input.generationId,
    prompt: BACKGROUND_PROMPT_PREFIX + input.prompt,
  });

  // Save asset to per-workspace generated/ folder so users can browse later.
  const storage = getStorage();
  const filename = `bg-${Date.now()}.${mimeType === 'image/jpeg' ? 'jpg' : 'png'}`;
  const key = storageKeys.generated(input.workspaceId, filename);
  await storage.put(key, bytes, mimeType);

  // Embed as data URI so the rendered PNG (Playwright setContent) gets the
  // image without a CORS/network roundtrip.
  const dataUri = `data:${mimeType};base64,${bytes.toString('base64')}`;
  const updatedHtml = injectBackground(generation.currentHtml, dataUri);

  const versionNumber = await nextVersionNumber(generation.id);
  const version = await insertGenerationVersion({
    generationId: generation.id,
    versionNumber,
    html: updatedHtml,
    triggeredBy: 'ai_edit',
    aiPrompt: `[bg] ${input.prompt}`,
  });
  await recordChatMessage({
    generationId: generation.id,
    role: 'user',
    content: `Generate background: ${input.prompt}`,
  });
  await recordChatMessage({
    generationId: generation.id,
    role: 'assistant',
    content: `Generated background and applied as v${versionNumber}.`,
    resultedInVersionId: version.id,
  });

  let pngKey: string | undefined;
  try {
    const rendered = await renderHtmlToPng({
      html: updatedHtml,
      format: generation.format,
      generationId: generation.id,
    });
    pngKey = rendered.pngKey;
  } catch (err) {
    logger.warn({ err, generationId: generation.id }, 'PNG render failed after background gen');
  }
  await updateGenerationCurrentHtml(generation.id, updatedHtml, pngKey);

  return { versionId: version.id, versionNumber, costUsd };
}

const INJECTED_RULE_PREFIX = 'body[data-bw-bg]';

function injectBackground(html: string, dataUri: string): string {
  // Add (or replace) a body rule that wins via attribute selector specificity.
  const rule = `\n${INJECTED_RULE_PREFIX}{background-image:url("${dataUri}");background-size:cover;background-position:center;background-repeat:no-repeat;}\n`;

  // Strip any prior injected rule so repeat applications don't pile up.
  const stripped = html.replace(
    new RegExp(`${INJECTED_RULE_PREFIX}\\{[^}]*\\}`, 'g'),
    '',
  );

  let withRule: string;
  if (/<\/style>/i.test(stripped)) {
    withRule = stripped.replace(/<\/style>/i, `${rule}</style>`);
  } else if (/<\/head>/i.test(stripped)) {
    withRule = stripped.replace(/<\/head>/i, `<style>${rule}</style></head>`);
  } else {
    // Last resort: wrap document.
    withRule = `<style>${rule}</style>${stripped}`;
  }

  // Ensure body has the marker attribute.
  if (/<body\b[^>]*data-bw-bg/i.test(withRule)) return withRule;
  if (/<body\b/i.test(withRule)) {
    return withRule.replace(/<body\b([^>]*)>/i, '<body$1 data-bw-bg>');
  }
  return withRule;
}
