/**
 * Browser-only HTML stamping. Walks the document and assigns a stable
 * `data-bw-id` attribute to every element that's a candidate for visual
 * editing. Idempotent: re-stamping keeps existing IDs and only fills gaps.
 *
 * Skips structural elements (<style>, <script>, <link>, <meta>, <head>, <html>)
 * and embedded SVG paths (too noisy).
 */

const SKIP_TAGS = new Set([
  'STYLE',
  'SCRIPT',
  'LINK',
  'META',
  'HEAD',
  'TITLE',
  'HTML',
  'BODY',
  'PATH',
  'CIRCLE',
  'RECT',
  'POLYGON',
  'POLYLINE',
  'LINE',
  'ELLIPSE',
  'DEFS',
  'STOP',
  'LINEARGRADIENT',
  'RADIALGRADIENT',
]);

export function stampHtml(html: string): string {
  if (typeof window === 'undefined') {
    throw new Error('stampHtml must be called in the browser');
  }
  const doc = new DOMParser().parseFromString(html, 'text/html');

  let counter = 0;
  // First pass: find max existing ID so we don't collide.
  doc.body.querySelectorAll('[data-bw-id]').forEach((el) => {
    const id = (el as HTMLElement).dataset.bwId ?? '';
    const m = id.match(/^e(\d+)$/);
    if (m) counter = Math.max(counter, parseInt(m[1]!, 10) + 1);
  });

  // Second pass: assign to anything missing.
  doc.body.querySelectorAll('*').forEach((el) => {
    const tag = el.tagName.toUpperCase();
    if (SKIP_TAGS.has(tag)) return;
    const html = el as HTMLElement;
    if (!html.dataset.bwId) {
      html.dataset.bwId = `e${counter++}`;
    }
  });

  return '<!DOCTYPE html>\n' + doc.documentElement.outerHTML;
}

/** Returns the closest ancestor (or self) carrying a `data-bw-id`. */
export function nearestStampedAncestor(target: EventTarget | null): HTMLElement | null {
  let el = target as HTMLElement | null;
  while (el) {
    if (el.dataset && el.dataset.bwId) return el;
    el = el.parentElement;
  }
  return null;
}

export function describeElement(el: HTMLElement): string {
  const tag = el.tagName.toLowerCase();
  const cls = el.className && typeof el.className === 'string' ? `.${el.className.split(/\s+/).filter(Boolean).slice(0, 1).join('.')}` : '';
  return `${tag}${cls}`;
}
