import { generateImage } from '@/lib/ai/gemini';
import { assertWithinDailyCaps } from '@/lib/ai/limits';
import {
  getGenerationForWorkspace,
  insertGenerationVersion,
  nextVersionNumber,
  recordChatMessage,
  updateGenerationCurrentHtml,
  updateGenerationCurrentTree,
} from '@/lib/db/queries/generations';
import { logger } from '@/lib/logger';
import { renderHtmlToPng } from '@/lib/renderer/render-png';
import { getStorage, storageKeys } from '@/lib/storage';
import { renderTreeToHtml } from '@/lib/tree/render-html';
import type { GenerationFormat } from '@/lib/db/schema';
import type { BannerTree } from '@/lib/tree/types';

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
  const versionNumber = await nextVersionNumber(generation.id);

  if (generation.currentTree) {
    return await applyToTree({
      generationId: generation.id,
      format: generation.format,
      tree: generation.currentTree,
      dataUri,
      versionNumber,
      costUsd,
      promptText: input.prompt,
    });
  }

  if (!generation.currentHtml) {
    throw new Error('Generation has neither a tree nor legacy HTML to update.');
  }

  return await applyToLegacyHtml({
    generationId: generation.id,
    format: generation.format,
    currentHtml: generation.currentHtml,
    dataUri,
    versionNumber,
    costUsd,
    promptText: input.prompt,
  });
}

type CommonArgs = {
  generationId: string;
  format: GenerationFormat;
  dataUri: string;
  versionNumber: number;
  costUsd: number;
  promptText: string;
};

async function applyToTree(args: CommonArgs & { tree: BannerTree }): Promise<BackgroundResult> {
  const { generationId, format, tree, dataUri, versionNumber, costUsd, promptText } = args;

  // Drive the canvas background — sits beneath all node content.
  const updatedTree: BannerTree = {
    ...tree,
    canvas: {
      ...tree.canvas,
      background: { kind: 'image', src: dataUri, fit: 'cover' },
    },
  };

  const htmlCache = renderTreeToHtml(updatedTree);

  const version = await insertGenerationVersion({
    generationId,
    versionNumber,
    tree: updatedTree,
    html: htmlCache,
    triggeredBy: 'ai_edit',
    aiPrompt: `[bg] ${promptText}`,
  });

  await recordChatMessage({
    generationId,
    role: 'user',
    content: `Generate background: ${promptText}`,
  });
  await recordChatMessage({
    generationId,
    role: 'assistant',
    content: `Generated background and applied as v${versionNumber}.`,
    resultedInVersionId: version.id,
  });

  let pngKey: string | undefined;
  try {
    const rendered = await renderHtmlToPng({
      tree: updatedTree,
      format,
      generationId,
    });
    pngKey = rendered.pngKey;
  } catch (err) {
    logger.warn({ err, generationId }, 'PNG render failed after tree bg gen');
  }
  await updateGenerationCurrentTree(generationId, updatedTree, htmlCache, pngKey);

  return { versionId: version.id, versionNumber, costUsd };
}

async function applyToLegacyHtml(args: CommonArgs & { currentHtml: string }): Promise<BackgroundResult> {
  const { generationId, format, currentHtml, dataUri, versionNumber, costUsd, promptText } = args;
  const updatedHtml = injectBackground(currentHtml, dataUri);

  const version = await insertGenerationVersion({
    generationId,
    versionNumber,
    html: updatedHtml,
    triggeredBy: 'ai_edit',
    aiPrompt: `[bg] ${promptText}`,
  });
  await recordChatMessage({
    generationId,
    role: 'user',
    content: `Generate background: ${promptText}`,
  });
  await recordChatMessage({
    generationId,
    role: 'assistant',
    content: `Generated background and applied as v${versionNumber}.`,
    resultedInVersionId: version.id,
  });

  let pngKey: string | undefined;
  try {
    const rendered = await renderHtmlToPng({
      html: updatedHtml,
      format,
      generationId,
    });
    pngKey = rendered.pngKey;
  } catch (err) {
    logger.warn({ err, generationId }, 'PNG render failed after legacy bg gen');
  }
  await updateGenerationCurrentHtml(generationId, updatedHtml, pngKey);

  return { versionId: version.id, versionNumber, costUsd };
}

const INJECTED_RULE_PREFIX = 'body[data-bw-bg]';

function injectBackground(html: string, dataUri: string): string {
  const rule = `\n${INJECTED_RULE_PREFIX}{background-image:url("${dataUri}");background-size:cover;background-position:center;background-repeat:no-repeat;}\n`;
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
    withRule = `<style>${rule}</style>${stripped}`;
  }
  if (/<body\b[^>]*data-bw-bg/i.test(withRule)) return withRule;
  if (/<body\b/i.test(withRule)) {
    return withRule.replace(/<body\b([^>]*)>/i, '<body$1 data-bw-bg>');
  }
  return withRule;
}
