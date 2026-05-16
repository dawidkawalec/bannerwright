import { logger } from '../logger';
import { withContext } from './playwright';

/**
 * Convert an SVG buffer to a PNG buffer by rendering it in a tiny Chromium
 * context. Used for brand logos uploaded as SVG — Gemini's multimodal input
 * accepts PNG/JPEG/WEBP only, so SVG must be rasterised before we attach it
 * to the prompt. Re-uses the existing Playwright singleton — no new npm dep.
 */
export async function rasterizeSvgToPng(svg: Buffer, targetSize = 512): Promise<Buffer> {
  const dataUri = `data:image/svg+xml;base64,${svg.toString('base64')}`;
  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
  html,body{margin:0;padding:0;background:transparent;}
  body{width:${targetSize}px;height:${targetSize}px;display:flex;align-items:center;justify-content:center;}
  img{max-width:100%;max-height:100%;object-fit:contain;}
</style></head><body><img id="logo" src="${dataUri}"></body></html>`;

  return await withContext(async (ctx) => {
    const page = await ctx.newPage();
    try {
      await page.setViewportSize({ width: targetSize, height: targetSize });
      await page.setContent(html, { waitUntil: 'load', timeout: 8_000 });
      // Make sure the <img> finished decoding so the screenshot captures pixels.
      await page.waitForFunction(
        () => {
          const el = document.getElementById('logo') as HTMLImageElement | null;
          return !!el && el.complete && el.naturalWidth > 0;
        },
        null,
        { timeout: 6_000 },
      ).catch(() => {
        logger.warn('SVG decode timed out; rasterising whatever Chromium has');
      });
      const png = await page.screenshot({
        type: 'png',
        omitBackground: true,
        clip: { x: 0, y: 0, width: targetSize, height: targetSize },
      });
      return Buffer.from(png);
    } finally {
      await page.close().catch(() => {});
    }
  });
}
