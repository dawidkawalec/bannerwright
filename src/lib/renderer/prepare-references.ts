import { logger } from '../logger';
import { dimensionsFor } from './formats';
import { withContext } from './playwright';
import type { GenerationFormat } from '../db/schema';

export type ReferenceImage = { mimeType: string; bytes: Buffer };

/**
 * Pre-crop reference images to the target format's aspect ratio + resize them
 * down to a reasonable upload size before passing them to Nano Banana.
 *
 * Why: Nano Banana (`gemini-3-pro-image-preview`) inherits the OUTPUT aspect
 * ratio from the *reference* images, not from the prompt text. Sending raw
 * 1440×900 KB screenshots into a square (1080×1080) generation produces a
 * 1280×800 widescreen output — confirmed with the bespokesoft.pl test set.
 *
 * Implementation reuses the Playwright singleton (no new npm dep, no `sharp`):
 * render each image into a same-aspect viewport with object-fit:cover, then
 * screenshot. Resize to `maxLongEdge` to keep multimodal token cost down.
 */
export async function prepareReferences(
  images: Array<ReferenceImage | undefined | null>,
  format: GenerationFormat,
  options: { maxLongEdge?: number } = {},
): Promise<ReferenceImage[]> {
  const valid = images.filter((i): i is ReferenceImage => !!i && i.bytes.length > 0);
  if (valid.length === 0) return [];

  const { width: targetW, height: targetH } = dimensionsFor(format);
  const maxLongEdge = options.maxLongEdge ?? 1024;
  const scale = Math.min(1, maxLongEdge / Math.max(targetW, targetH));
  const outW = Math.round(targetW * scale);
  const outH = Math.round(targetH * scale);

  const out: ReferenceImage[] = [];
  for (const img of valid) {
    try {
      const cropped = await cropToAspect(img, outW, outH);
      out.push({ mimeType: 'image/png', bytes: cropped });
    } catch (err) {
      logger.warn(
        { err, mime: img.mimeType, bytes: img.bytes.length },
        'prepareReferences: failed to crop a reference image; skipping',
      );
    }
  }
  return out;
}

async function cropToAspect(
  img: ReferenceImage,
  outW: number,
  outH: number,
): Promise<Buffer> {
  const dataUri = `data:${img.mimeType};base64,${img.bytes.toString('base64')}`;
  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
  html,body{margin:0;padding:0;background:#fff;}
  body{width:${outW}px;height:${outH}px;overflow:hidden;}
  img{width:100%;height:100%;object-fit:cover;object-position:center;display:block;}
</style></head><body><img id="ref" src="${dataUri}"></body></html>`;

  return await withContext(async (ctx) => {
    const page = await ctx.newPage();
    try {
      await page.setViewportSize({ width: outW, height: outH });
      await page.setContent(html, { waitUntil: 'load', timeout: 10_000 });
      await page
        .waitForFunction(
          () => {
            const el = document.getElementById('ref') as HTMLImageElement | null;
            return !!el && el.complete && el.naturalWidth > 0;
          },
          null,
          { timeout: 8_000 },
        )
        .catch(() => {
          logger.warn('prepareReferences: image decode timed out; capturing whatever Chromium has');
        });
      const png = await page.screenshot({
        type: 'png',
        clip: { x: 0, y: 0, width: outW, height: outH },
      });
      return Buffer.from(png);
    } finally {
      await page.close().catch(() => {});
    }
  });
}
