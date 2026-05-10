import { chromium, type Browser, type BrowserContext } from 'playwright';
import { logger } from '../logger';

const MAX_CONTEXTS = 3;
const RENDERS_PER_BROWSER_RESTART = 100;

declare global {
  var __bw_browser: Browser | undefined;
  var __bw_renderCount: number | undefined;
  var __bw_activeContexts: number | undefined;
  var __bw_waitQueue: Array<() => void> | undefined;
}

global.__bw_renderCount ??= 0;
global.__bw_activeContexts ??= 0;
global.__bw_waitQueue ??= [];

async function getBrowser(): Promise<Browser> {
  if (!global.__bw_browser || !global.__bw_browser.isConnected()) {
    logger.info('launching chromium');
    global.__bw_browser = await chromium.launch({
      args: ['--disable-dev-shm-usage', '--no-sandbox'],
    });
  }
  if ((global.__bw_renderCount ?? 0) >= RENDERS_PER_BROWSER_RESTART) {
    logger.info({ count: global.__bw_renderCount }, 'restarting chromium (render quota reached)');
    await global.__bw_browser.close().catch(() => {});
    global.__bw_browser = undefined;
    global.__bw_renderCount = 0;
    return getBrowser();
  }
  return global.__bw_browser;
}

async function acquireSlot(): Promise<void> {
  if ((global.__bw_activeContexts ?? 0) < MAX_CONTEXTS) {
    global.__bw_activeContexts = (global.__bw_activeContexts ?? 0) + 1;
    return;
  }
  await new Promise<void>((resolve) => {
    global.__bw_waitQueue!.push(resolve);
  });
  global.__bw_activeContexts = (global.__bw_activeContexts ?? 0) + 1;
}

function releaseSlot() {
  global.__bw_activeContexts = Math.max(0, (global.__bw_activeContexts ?? 1) - 1);
  const next = global.__bw_waitQueue?.shift();
  if (next) next();
}

/**
 * Acquire an isolated browser context (queued if pool is full).
 * Caller MUST close the context when done.
 */
export async function withContext<T>(
  fn: (ctx: BrowserContext) => Promise<T>,
): Promise<T> {
  await acquireSlot();
  const browser = await getBrowser();
  const ctx = await browser.newContext({
    bypassCSP: false,
    javaScriptEnabled: true,
    viewport: null,
  });
  try {
    const result = await fn(ctx);
    global.__bw_renderCount = (global.__bw_renderCount ?? 0) + 1;
    return result;
  } finally {
    await ctx.close().catch(() => {});
    releaseSlot();
  }
}

export async function shutdownBrowser() {
  if (global.__bw_browser) {
    await global.__bw_browser.close().catch(() => {});
    global.__bw_browser = undefined;
  }
}
