import { logger } from '../logger';
import { withContext } from './playwright';

export type ScrapeResult = {
  title?: string;
  ogImage?: string;
  favicon?: string;
  description?: string;
  bodyText: string;
  screenshot: Buffer;
};

const MAX_BODY_CHARS = 50_000;

export async function scrapeUrl(url: string): Promise<ScrapeResult> {
  return withContext(async (ctx) => {
    const page = await ctx.newPage();
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30_000 });

    const meta = await page.evaluate(() => {
      const get = (sel: string, attr = 'content') =>
        (document.querySelector(sel) as HTMLMetaElement | HTMLLinkElement | null)?.getAttribute(attr) ?? undefined;
      return {
        title: document.title,
        ogImage: get('meta[property="og:image"]'),
        favicon: get('link[rel~="icon"]', 'href'),
        description:
          get('meta[name="description"]') ?? get('meta[property="og:description"]'),
        bodyText: document.body?.innerText?.slice(0, 50_000) ?? '',
      };
    });

    const screenshot = await page.screenshot({ type: 'png', fullPage: true });

    logger.info({ url, bytes: screenshot.length }, 'scraped url');
    return {
      ...meta,
      bodyText: meta.bodyText.slice(0, MAX_BODY_CHARS),
      screenshot,
    };
  });
}
