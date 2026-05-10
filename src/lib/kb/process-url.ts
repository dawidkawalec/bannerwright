import { logger } from '../logger';
import { scrapeUrl } from '../renderer/scrape-url';
import { getStorage, storageKeys } from '../storage';
import { getKbSource, updateKbStatus } from '../db/queries/kb';

/**
 * Background worker: scrape URL → save screenshot + extracted content.
 * Fire-and-forget — caller MUST attach a `.catch()` to swallow rejections.
 */
export async function processKbUrl(sourceId: string): Promise<void> {
  const source = await getKbSource(sourceId);
  if (!source || source.sourceType !== 'url' || !source.url) {
    logger.warn({ sourceId }, 'processKbUrl: source not found or not a URL');
    return;
  }

  await updateKbStatus(sourceId, { status: 'processing' });

  try {
    const result = await scrapeUrl(source.url);
    const key = storageKeys.kbScreenshot(source.workspaceId, sourceId);
    await getStorage().put(key, result.screenshot, 'image/png');

    await updateKbStatus(sourceId, {
      status: 'ready',
      contentText: result.bodyText,
      screenshotPath: key,
      title: result.title || source.url,
      metadata: {
        favicon: result.favicon,
        ogImage: result.ogImage,
        description: result.description,
      },
      processedAt: new Date(),
    });
    logger.info({ sourceId, url: source.url }, 'kb url processed');
  } catch (err) {
    logger.error({ err, sourceId, url: source.url }, 'kb url processing failed');
    await updateKbStatus(sourceId, {
      status: 'failed',
      errorMessage: err instanceof Error ? err.message : String(err),
      processedAt: new Date(),
    });
  }
}
