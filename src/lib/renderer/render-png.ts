import DOMPurify from 'isomorphic-dompurify';
import { logger } from '../logger';
import { getStorage, storageKeys } from '../storage';
import type { GenerationFormat } from '../db/schema';
import { dimensionsFor } from './formats';
import { withContext } from './playwright';

export type RenderInput = {
  html: string;
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
  const sanitised = DOMPurify.sanitize(input.html, SANITIZE_CONFIG);

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
