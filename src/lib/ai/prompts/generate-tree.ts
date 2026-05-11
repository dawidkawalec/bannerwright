import type { Content } from '@google/genai';
import type { BrandColors, BrandFonts, GenerationFormat, KbSource } from '@/lib/db/schema';
import { dimensionsFor } from '@/lib/renderer/formats';

export const GENERATE_TREE_SYSTEM = `You are Bannerwright, an AI visual designer that produces social-media banners as a structured JSON tree.

You output ONE JSON document matching the provided schema. Nothing else — no prose, no markdown fences.

The banner is a tree of typed nodes positioned absolutely on a fixed canvas:
- type "frame": a container (must have children: []). The root is always a frame matching canvas size.
- type "text": single text block. Set "font" {family, weight, size}, "color" (hex), "align". Use "\\n" for line breaks.
- type "image": a raster image. Set "src" (absolute https URL or data URI), "fit" ("cover" or "contain"), optional "cornerRadius".
- type "shape": "variant" "rect" or "ellipse". Set "fill" (kind solid|linear|image). Optional "cornerRadius", "stroke", "shadow".
- type "button": call-to-action. Set "label", "fill", "textColor", "cornerRadius", "font", "padding" {x, y}.
- type "group": a logical group of nodes (rare; prefer "frame").

Every node needs:
- "id": a stable short string (you may reuse "n_abc123" style). For new generations, generate fresh ids.
- "type": one of the values above.
- "frame": { x, y, w, h } — pixels in PARENT space. Root frame is { x:0, y:0, w:canvasWidth, h:canvasHeight }.

Hard rules — violations disqualify the output:
1. The "schemaVersion" field MUST equal 1.
2. The "root" node MUST be type "frame" with frame { x:0, y:0, w:canvasWidth, h:canvasHeight } matching the requested canvas dimensions exactly.
3. Children fit inside their parent frame.
4. Use hex colors only (e.g. "#0F172A"). No css color names, no rgba.
5. Background: prefer "canvas.background" (solid or linear). For full-bleed photo backgrounds, use an image-fill on the root frame's "fill" field.
6. Typography: headline >= 64px on 1080-wide canvases. Use generous, intentional sizing.
7. URLs for images must be absolute https URLs or data URIs.
8. "fonts" at the top-level lists Google Fonts the document uses, with weight lists, so the renderer can preload them. ALWAYS include at least one font that matches the fonts you use in nodes.
9. Reply with ONLY the JSON document.

Quality bar:
- Layouts should feel intentional, not generic. Pick a strong headline framing.
- Respect the brief literally: if it says "30% off", that figure must be the visual hero.
- Use the provided brand colors and fonts unless the brief contradicts.
- Prefer 4–8 nodes for a typical banner; avoid more than ~20.`;

export type BuildGenerateTreePromptInput = {
  format: GenerationFormat;
  brief: string;
  brandColors?: BrandColors | null;
  brandFonts?: BrandFonts | null;
  kb: Array<Pick<KbSource, 'title' | 'url' | 'contentText'>>;
  screenshots?: Array<{ mimeType: string; bytes: Buffer }>;
  inspirations?: Array<{ mimeType: string; bytes: Buffer }>;
};

const MAX_KB_CHARS_PER_SOURCE = 6_000;

export function buildGenerateTreeContents(input: BuildGenerateTreePromptInput): Content[] {
  const { width, height } = dimensionsFor(input.format);
  const parts: Content['parts'] = [];

  parts.push({
    text: [
      `--- REQUEST ---`,
      `Format: ${input.format} (canvas ${width}×${height}px).`,
      `Brief: ${input.brief}`,
      '',
      brandSummary(input.brandColors, input.brandFonts),
      '',
      kbSummary(input.kb),
      '',
      'Produce the BannerTree JSON now. Match the schema exactly.',
    ].join('\n'),
  });

  for (const shot of input.screenshots ?? []) {
    parts.push({
      inlineData: { mimeType: shot.mimeType, data: shot.bytes.toString('base64') },
    });
  }

  if ((input.inspirations ?? []).length > 0) {
    parts.push({
      text:
        'Below are user-attached inspiration images. Treat them as visual moodboard cues ' +
        '(composition, palette, typography vibe). DO NOT copy them literally and DO NOT embed ' +
        'them as image fills in the output.',
    });
    for (const ref of input.inspirations!) {
      parts.push({
        inlineData: { mimeType: ref.mimeType, data: ref.bytes.toString('base64') },
      });
    }
  }

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

function kbSummary(kb: BuildGenerateTreePromptInput['kb']): string {
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
