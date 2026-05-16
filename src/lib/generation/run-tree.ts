import { generateContent, generateImage } from '@/lib/ai/gemini';
import { assertWithinDailyCaps } from '@/lib/ai/limits';
import {
  buildGenerateTreeContents,
  GENERATE_TREE_SYSTEM,
} from '@/lib/ai/prompts/generate-tree';
import {
  buildDesignPrompt,
  getPreset,
  type StylePresetId,
} from '@/lib/ai/style-presets';
import {
  buildEncodeDesignContents,
  ENCODE_DESIGN_SYSTEM,
} from '@/lib/ai/prompts/encode-design';
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
import { rasterizeSvgToPng } from '@/lib/renderer/rasterize-svg';
import { getStorage, storageKeys } from '@/lib/storage';
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
  /** Visual style preset — drives the Nano Banana background prompt + typography hint. */
  style?: StylePresetId;
  /** Force-disable background generation even when the preset wants one. */
  withBackground?: boolean;
};

export type RunTreeEvent =
  | { type: 'progress'; step: 'analyzing_kb' | 'rendering_background' | 'generating_tree' | 'rendering_png' }
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

  let logo: { mimeType: string; bytes: Buffer } | undefined;
  if (workspace.logoUrl) {
    const logoMime = mimeFromKey(workspace.logoUrl);
    try {
      const bytes = await storage.get(workspace.logoUrl);
      if (logoMime === 'image/svg+xml') {
        // Gemini multimodal input accepts PNG/JPEG/WEBP only — rasterise the
        // SVG via Chromium so the model can still see + place the logo.
        const png = await rasterizeSvgToPng(bytes);
        logo = { mimeType: 'image/png', bytes: png };
      } else {
        logo = { mimeType: logoMime, bytes };
      }
    } catch (err) {
      logger.warn({ err, key: workspace.logoUrl }, 'logo prompt prep failed');
    }
  }

  // ── Branch: image-first NB→Vision pipeline OR text-only quick draft ────────
  const preset = getPreset(input.style);
  const useImageFirst = (input.withBackground ?? preset.withBackground) && preset.id !== 'auto';
  let refImageCostUsd = 0;
  let tree: BannerTree;

  if (useImageFirst) {
    // Step 1: Nano Banana renders the COMPLETE banner (text + composition).
    const designPrompt = buildDesignPrompt({
      preset,
      brief: input.brief,
      brandColors: workspace.brandColors,
      brandFonts: workspace.brandFonts,
      kbSnippet: ready[0]?.contentText ?? undefined,
    });

    let refImage: { mimeType: string; bytes: Buffer } | undefined;
    if (designPrompt) {
      emit({ type: 'progress', step: 'rendering_background' });
      try {
        const { bytes, mimeType, costUsd } = await generateImage({
          model: 'gemini-3-pro-image-preview',
          operation: 'image_gen',
          workspaceId: workspace.id,
          prompt: designPrompt,
        });
        refImageCostUsd = costUsd;
        // Persist as a reference artifact in /assets — user can review or re-use.
        const filename = `design-${Date.now()}.${mimeType === 'image/jpeg' ? 'jpg' : 'png'}`;
        const key = storageKeys.generated(workspace.id, filename);
        await storage.put(key, bytes, mimeType);
        refImage = { mimeType, bytes };
      } catch (err) {
        logger.warn(
          { err, style: preset.id },
          'Nano Banana full design failed — falling back to text-only Gemini',
        );
      }
    }

    if (refImage) {
      // Step 2: Gemini Vision encodes the image into a BannerTree.
      emit({ type: 'progress', step: 'generating_tree' });
      tree = await generateValidatedTree({
        workspaceId: workspace.id,
        systemInstruction: `${ENCODE_DESIGN_SYSTEM}${preset.typographyHint}`,
        contents: buildEncodeDesignContents({
          refImage,
          format: input.format,
          brief: input.brief,
          brandColors: workspace.brandColors,
          brandFonts: workspace.brandFonts,
          preset,
        }),
      });
    } else {
      // Fallback: NB call failed → text-only Gemini.
      emit({ type: 'progress', step: 'generating_tree' });
      tree = await generateValidatedTree({
        workspaceId: workspace.id,
        systemInstruction: `${GENERATE_TREE_SYSTEM}${preset.typographyHint}`,
        contents: buildGenerateTreeContents({
          format: input.format,
          brief: input.brief,
          brandColors: workspace.brandColors,
          brandFonts: workspace.brandFonts,
          kb: ready.map((s) => ({ title: s.title, url: s.url, contentText: s.contentText })),
          screenshots,
          inspirations,
          logo,
        }),
      });
    }
  } else {
    // Text-only fast path (Auto preset or withBackground=false).
    emit({ type: 'progress', step: 'generating_tree' });
    tree = await generateValidatedTree({
      workspaceId: workspace.id,
      systemInstruction: `${GENERATE_TREE_SYSTEM}${preset.typographyHint}`,
      contents: buildGenerateTreeContents({
        format: input.format,
        brief: input.brief,
        brandColors: workspace.brandColors,
        brandFonts: workspace.brandFonts,
        kb: ready.map((s) => ({ title: s.title, url: s.url, contentText: s.contentText })),
        screenshots,
        inspirations,
        logo,
      }),
    });
  }

  if (logo) {
    replaceLogoPlaceholder(tree, logo);
  }

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
    costUsd: refImageCostUsd,
  });
}

type GenerateValidatedInput = {
  workspaceId: string;
  systemInstruction: string;
  /** Pre-built multimodal contents (text-only generate OR vision-encode). */
  contents: Parameters<typeof generateContent>[0]['contents'];
};

async function generateValidatedTree({
  workspaceId,
  systemInstruction,
  contents: baseContents,
}: GenerateValidatedInput): Promise<BannerTree> {
  let lastError: string | undefined;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const contents = lastError
      ? appendRetryFeedback(baseContents, lastError)
      : baseContents;

    const result = await generateContent({
      model: 'gemini-3.1-pro-preview',
      operation: 'generate_html',
      workspaceId,
      systemInstruction,
      contents,
      responseSchema: BANNER_TREE_JSON_SCHEMA,
    });

    try {
      const raw = JSON.parse(stripFences(result.text));
      const tree = bannerTreeSchema.parse(applyTreeDefaults(raw));
      const textOrButtonCount = countTextLikeNodes(tree.root);
      if (textOrButtonCount === 0) {
        throw new Error(
          `Banner has no text or button nodes (${
            tree.root.children?.length ?? 0
          } total children, all decorative). Banners MUST include at least a headline text node; ideally also a supporting line and a CTA button. Produce a real banner with 5–10 nodes including the headline.`,
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

function appendRetryFeedback(
  contents: Parameters<typeof generateContent>[0]['contents'],
  err: string,
): Parameters<typeof generateContent>[0]['contents'] {
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

const LOGO_PLACEHOLDER = '__BW_LOGO__';

function mimeFromKey(key: string): string {
  const ext = key.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'webp':
      return 'image/webp';
    case 'svg':
      return 'image/svg+xml';
    default:
      return 'image/png';
  }
}

function replaceLogoPlaceholder(
  tree: BannerTree,
  logo: { mimeType: string; bytes: Buffer },
): void {
  const dataUri = `data:${logo.mimeType};base64,${logo.bytes.toString('base64')}`;
  walkNodes(tree.root as unknown as MutableNode, (node) => {
    if (node.type === 'image' && node.src === LOGO_PLACEHOLDER) {
      node.src = dataUri;
    }
  });
}

type MutableNode = {
  type: string;
  src?: string;
  children?: MutableNode[];
};

function walkNodes(node: MutableNode, fn: (n: MutableNode) => void): void {
  fn(node);
  if (Array.isArray(node.children)) {
    for (const c of node.children) {
      if (c && typeof c === 'object' && 'type' in c) {
        walkNodes(c, fn);
      }
    }
  }
}

function countTextLikeNodes(node: { type: string; children?: unknown[] }): number {
  let count = 0;
  if (node.type === 'text' || node.type === 'button') count += 1;
  if (Array.isArray(node.children)) {
    for (const child of node.children) {
      if (child && typeof child === 'object' && 'type' in child) {
        count += countTextLikeNodes(child as { type: string; children?: unknown[] });
      }
    }
  }
  return count;
}

function stripFences(text: string): string {
  const trimmed = text.trim();
  const fenceMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)```$/i);
  return fenceMatch ? fenceMatch[1]!.trim() : trimmed;
}

function deriveTitle(brief: string): string {
  return brief.replace(/[\n\r]+/g, ' ').slice(0, 80).trim() || 'Untitled banner';
}
