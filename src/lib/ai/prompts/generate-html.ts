import type { Content } from '@google/genai';
import type {
  BrandColors,
  BrandFonts,
  GenerationFormat,
  KbSource,
} from '@/lib/db/schema';
import { dimensionsFor } from '@/lib/renderer/formats';
import { GOLD_EXAMPLES } from './examples';

export const GENERATE_HTML_SYSTEM = `You are Bannerwright, an HTML graphic generator that produces banners for social media as a single self-contained HTML document.

Hard rules — violating any disqualifies the output:
1. Output ONE complete HTML document starting with <!DOCTYPE html>. Nothing before or after the closing </html>.
2. Inline CSS only, inside a single <style> tag in <head>. No external stylesheet links.
3. Google Fonts may be loaded via @import url(...) inside the <style> tag. NO other external resources.
4. NO <script> tags, NO inline event handlers, NO JavaScript of any kind.
5. The viewport size MUST match the format exactly. Set html, body width and height to the requested px values, and design for that size.
6. Background must fill the entire canvas; nothing transparent unless explicitly briefed.
7. URLs must be absolute (https://...) or data URIs. No relative paths.
8. Use the brand colours and fonts provided. Treat the primary colour as the dominant accent unless the brief contradicts.
9. Optimise for legibility at thumbnail size: high contrast, generous type scale (headline ≥ 72 px on 1080-wide canvases), one focal element.

Quality bar:
- Layout should feel intentional, not generic. Pick a strong headline framing (oversized, broken across two lines, italic emphasis on the offer).
- Add subtle visual interest (gradient, geometric shape, or one decorative motif) without clutter.
- Respect the brief literally — if it says "30% off", that figure must be the visual hero.
- If the brand tone is "luxury" or "minimalist", keep ornamentation low and use whitespace.
- If the tone is "playful" or "bold", use saturated colours and strong typography.

Reply with HTML only. No prose, no markdown fences.`;

export type BuildPromptInput = {
  format: GenerationFormat;
  brief: string;
  brandColors?: BrandColors | null;
  brandFonts?: BrandFonts | null;
  /** Up to 5 ready KB sources to ground the generation in real brand context. */
  kb: Array<Pick<KbSource, 'title' | 'url' | 'contentText'>>;
  /** Optional inline screenshot bytes (PNG) from the most relevant KB sources. */
  screenshots?: Array<{ mimeType: string; bytes: Buffer }>;
};

const MAX_KB_CHARS_PER_SOURCE = 8_000;

export function buildGenerateHtmlContents(input: BuildPromptInput): Content[] {
  const { width, height } = dimensionsFor(input.format);
  const parts: Content['parts'] = [];

  // Few-shot example for this format if available.
  const example = GOLD_EXAMPLES.find((e) => e.format === input.format);
  if (example) {
    parts.push({
      text: [
        '--- EXAMPLE (input → output) ---',
        `Brief: ${example.brief}`,
        `Brand: primary=${example.brand.primary} accent=${example.brand.accent} font=${example.brand.headlineFont}`,
        `Format: ${input.format} (${width}×${height}px)`,
        '',
        'Output:',
        example.html,
        '--- END EXAMPLE ---',
      ].join('\n'),
    });
  }

  parts.push({
    text: [
      `--- THIS REQUEST ---`,
      `Format: ${input.format} (${width}×${height}px exactly).`,
      brandSummary(input.brandColors, input.brandFonts),
      kbSummary(input.kb),
      '',
      `Brief: ${input.brief}`,
    ].join('\n'),
  });

  for (const shot of input.screenshots ?? []) {
    parts.push({
      inlineData: { mimeType: shot.mimeType, data: shot.bytes.toString('base64') },
    });
  }

  parts.push({
    text: 'Now produce the HTML for THIS REQUEST. Single document, inline CSS, exact viewport. Nothing else.',
  });

  return [{ role: 'user', parts }];
}

function brandSummary(colors?: BrandColors | null, fonts?: BrandFonts | null): string {
  const lines: string[] = ['Brand:'];
  if (colors?.primary) lines.push(`  primary: ${colors.primary}`);
  if (colors?.secondary) lines.push(`  secondary: ${colors.secondary}`);
  if (colors?.accent) lines.push(`  accent: ${colors.accent}`);
  if (colors?.background) lines.push(`  background: ${colors.background}`);
  if (colors?.text) lines.push(`  text: ${colors.text}`);
  if (fonts?.headline) lines.push(`  headline font: ${fonts.headline}`);
  if (fonts?.body) lines.push(`  body font: ${fonts.body}`);
  if (lines.length === 1) lines.push('  (no brand defined — pick tasteful defaults)');
  return lines.join('\n');
}

function kbSummary(kb: BuildPromptInput['kb']): string {
  if (kb.length === 0) return 'Knowledge base: (none)';
  const blocks = kb.map((s, i) => {
    const text = (s.contentText ?? '').slice(0, MAX_KB_CHARS_PER_SOURCE);
    return [
      `[KB ${i + 1}] ${s.title ?? '(untitled)'}${s.url ? ` (${s.url})` : ''}`,
      text || '(no text extracted)',
    ].join('\n');
  });
  return ['Knowledge base:', ...blocks].join('\n\n');
}
