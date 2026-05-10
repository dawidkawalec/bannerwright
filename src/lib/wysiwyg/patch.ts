/**
 * Browser-only HTML patcher. All visual edits go through {@link applyOps},
 * which parses the HTML, applies a batch of ops by `data-bw-id`, and
 * serialises back to a complete document string.
 */

export type VisualOp =
  | { kind: 'text'; bwId: string; text: string }
  | { kind: 'style'; bwId: string; prop: string; value: string };

export function applyOps(html: string, ops: VisualOp[]): string {
  if (typeof window === 'undefined') {
    throw new Error('applyOps must be called in the browser');
  }
  if (ops.length === 0) return html;

  const doc = new DOMParser().parseFromString(html, 'text/html');

  for (const op of ops) {
    const el = doc.querySelector(`[data-bw-id="${cssEscape(op.bwId)}"]`) as
      | HTMLElement
      | null;
    if (!el) continue;
    if (op.kind === 'text') {
      setTextWithLineBreaks(el, op.text);
    } else if (op.kind === 'style') {
      if (op.value === '' || op.value == null) {
        el.style.removeProperty(op.prop);
      } else {
        el.style.setProperty(op.prop, op.value);
      }
    }
  }

  return '<!DOCTYPE html>\n' + doc.documentElement.outerHTML;
}

/**
 * Replace an element's inline content with the given text, preserving newlines
 * as <br> tags. Children that were not text nodes / <br> (e.g. nested spans)
 * are removed since the visual text editor only deals with the inline text of
 * the selected element. We use the element's owner document so this works
 * inside both the visual canvas (DOMParser doc) and the live preview.
 */
function setTextWithLineBreaks(el: HTMLElement, text: string): void {
  while (el.firstChild) el.removeChild(el.firstChild);
  const lines = text.split('\n');
  const doc = el.ownerDocument;
  lines.forEach((line, i) => {
    if (i > 0) el.appendChild(doc.createElement('br'));
    if (line.length > 0) el.appendChild(doc.createTextNode(line));
  });
}

function cssEscape(s: string): string {
  // CSS.escape exists in all modern browsers; fall back to a simple version.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const css = (globalThis as any).CSS;
  if (css && typeof css.escape === 'function') return css.escape(s);
  return s.replace(/[^\w-]/g, (c) => `\\${c}`);
}

/**
 * Read the current style of a stamped element from a live shadow tree.
 * Used to populate the toolbar with the element's actual rendered values.
 */
export function readElementStyle(el: HTMLElement) {
  const cs = window.getComputedStyle(el);
  return {
    color: cs.color,
    backgroundColor: cs.backgroundColor,
    fontSize: cs.fontSize,
    fontFamily: cs.fontFamily,
    fontWeight: cs.fontWeight,
    textAlign: cs.textAlign,
    padding: cs.padding,
  };
}

/** Convert any colour string to a 6-digit hex for <input type="color">. */
export function rgbToHex(rgb: string): string {
  const m = rgb.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  if (!m) return '#000000';
  const [, r, g, b] = m;
  const hex = (n: number) => n.toString(16).padStart(2, '0');
  return '#' + hex(+r!) + hex(+g!) + hex(+b!);
}
