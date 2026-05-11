import DOMPurify from 'isomorphic-dompurify';
import { logger } from '../logger';
import { getStorage, storageKeys } from '../storage';
import type { GenerationFormat } from '../db/schema';
import type { BannerTree } from '../tree/types';
import { renderTreeToHtml } from '../tree/render-html';
import { dimensionsFor } from './formats';
import { withContext } from './playwright';

export type RenderInput = {
  /** Legacy: pass raw HTML. New code should pass `tree` instead. */
  html?: string;
  /** New: typed banner tree. When provided, takes precedence over `html`. */
  tree?: BannerTree;
  format: GenerationFormat;
  generationId?: string;
  versionId?: string;
};

export type RenderResult = {
  pngKey: string;
  bytes: number;
};

const SANITIZE_CONFIG = {
  WHOLE_DOCUMENT: true,
  ADD_TAGS: ['style', 'link'],
  ADD_ATTR: ['rel', 'href', 'as', 'crossorigin', 'media'],
  FORBID_TAGS: ['script', 'noscript', 'iframe', 'object', 'embed'],
  FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'],
};

export async function renderHtmlToPng(input: RenderInput): Promise<RenderResult> {
  const { width, height } = dimensionsFor(input.format);
  const source = input.tree ? renderTreeToHtml(input.tree) : input.html;
  if (!source) {
    throw new Error('renderHtmlToPng: either `tree` or `html` must be provided');
  }
  const sanitised = DOMPurify.sanitize(source, SANITIZE_CONFIG);

  const png = await withContext(async (ctx) => {
    const page = await ctx.newPage();
    await page.setViewportSize({ width, height });
    await page.setContent(sanitised, { waitUntil: 'networkidle', timeout: 30_000 });
    return page.screenshot({ type: 'png', fullPage: false, omitBackground: false });
  });

  const key = input.generationId
    ? input.versionId
      ? storageKeys.generationVersionPng(input.generationId, input.versionId)
      : storageKeys.generationPng(input.generationId)
    : storageKeys.generationPng(`tmp-${Date.now()}`);

  const stored = await getStorage().put(key, png, 'image/png');
  logger.info({ key, bytes: stored.size, format: input.format }, 'rendered png');
  return { pngKey: stored.key, bytes: stored.size };
}
