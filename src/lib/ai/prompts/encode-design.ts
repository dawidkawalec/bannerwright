import type { Content } from '@google/genai';
import type { BrandColors, BrandFonts, GenerationFormat } from '@/lib/db/schema';
import { dimensionsFor } from '@/lib/renderer/formats';
import type { StylePreset } from '@/lib/ai/style-presets';

/**
 * System instruction for Gemini Vision when transcribing a finished banner
 * image into an editable BannerTree. The model SEES the image and must produce
 * a JSON tree that recreates the design as closely as possible — every visible
 * text block becomes a text node, every shape becomes a shape node, the rest
 * is taste.
 */
export const ENCODE_DESIGN_SYSTEM = `You are Bannerwright, an AI that takes a finished social-media banner image and reverse-engineers it into a structured editable JSON tree.

You output ONE JSON document matching the provided schema. Nothing else — no prose, no markdown fences.

The banner is a tree of typed nodes positioned absolutely on a fixed canvas:
- type "frame": container (must have children: []). Root is always a frame matching canvas size.
- type "text": single text block. Set "font" {family, weight, size}, "color" (hex), "align". Use "\\n" for line breaks.
- type "image": raster image. Set "src" (absolute https URL or data URI), "fit", optional "cornerRadius".
- type "shape": "variant" "rect" or "ellipse". Set "fill" (kind solid|linear|image). Optional "cornerRadius", "stroke".
- type "button": call-to-action. Set "label", "fill", "textColor", "cornerRadius", "font", "padding" {x, y}.

Every node needs:
- "id": stable short string (e.g. "n_abc123").
- "type": one of the values above.
- "frame": { x, y, w, h } — pixels in PARENT space. Root frame is { x:0, y:0, w:canvasWidth, h:canvasHeight }.

How to encode the image you see:

1. **Read every visible text block literally.** Match the text content character-for-character — including punctuation, line breaks, special characters (Polish diacritics, emoji, etc.). Each visible text block becomes one "text" node.
2. **Estimate positions in canvas pixels.** The canvas is 1080×1080 unless told otherwise. A headline that occupies the top half centred starts around y=120, headline-height ~120px → frame { x: 80, y: 120, w: 920, h: 200 }. Be generous with width so text doesn't clip.
3. **Estimate font weight + size from the image.** Heavy headline → weight 800-900, size 100-140px. Light caption → weight 300-400, size 16-24px. Body text 18-32px, sub-headlines 36-56px.
4. **Pick the closest Google Font family.** If you see a serif → "Playfair Display", "Cormorant Garamond", "Libre Caslon". Monospace → "Space Mono", "JetBrains Mono", "Fira Code". Modern sans → "Inter", "Manrope", "Plus Jakarta Sans". Geometric sans → "Montserrat", "Poppins". Always list the fonts you use in the top-level "fonts" array with weight lists so the renderer can preload them.
5. **Sample colours from the image.** Don't invent — read pixels. Use the supplied brand palette as ground truth where it matches what you see.
6. **Encode the background.** If the image background is a solid colour → set canvas.background = { kind: "solid", color: "#xxxxxx" }. If it's a linear gradient (two clearly separated colour bands) → canvas.background = { kind: "linear", angle: <degrees>, stops: [...] }. For complex photographic / gradient-mesh backgrounds you cannot reproduce in flat colour, set canvas.background = { kind: "solid", color: "<dominant colour>" } — the user can replace it later via Generate background.
7. **Decorative shapes the image clearly has** (large coloured blocks, circles behind text, dividers) become "shape" nodes. Skip noisy texture / grain / film effects that can't be cleanly recreated.
8. **CTA detection.** A pill or rectangle with text inside that looks clickable → "button" node with label + fill + textColor + cornerRadius. An underlined text link → keep as text node with the underline conveyed via styling (or just leave it as text — that's fine).
9. **Skip the logo.** If you see a brand logo glyph in the image, DO NOT try to recreate it as shapes — emit an image node with src = "__BW_LOGO__" (the server will swap in the workspace logo at render time) sized appropriately, OR omit it entirely if no workspace logo is set.

Hard rules — violations disqualify the output:
1. "schemaVersion" MUST equal 1.
2. "root" MUST be type "frame" with frame { x:0, y:0, w:canvasWidth, h:canvasHeight }.
3. Children fit inside their parent frame.
4. Hex colours only ("#0F172A"). No css color names, no rgba.
5. Reply with ONLY the JSON document.
6. Root frame's "children" array MUST NOT be empty — there is always at least a headline visible in the image.
7. Soft node budget: 5-12 total nodes. Cover the visible composition without obsessing over every grain of texture.

Quality bar: the user will open this in a visual editor and start typing replacement copy. Text positions, sizes, and colours must be close enough that swapping the text doesn't break the layout. When in doubt, err on the side of slightly larger text boxes so longer replacement copy still fits.`;

export type EncodeDesignInput = {
  refImage: { mimeType: string; bytes: Buffer };
  format: GenerationFormat;
  brief: string;
  brandColors?: BrandColors | null;
  brandFonts?: BrandFonts | null;
  preset: StylePreset;
};

export function buildEncodeDesignContents(input: EncodeDesignInput): Content[] {
  const { width, height } = dimensionsFor(input.format);
  const parts: Content['parts'] = [];

  parts.push({
    text: [
      `--- TARGET CANVAS ---`,
      `Format: ${input.format} (${width}×${height}px).`,
      ``,
      `--- ORIGINAL CREATIVE BRIEF ---`,
      input.brief.trim(),
      ``,
      brandSummary(input.brandColors, input.brandFonts),
      ``,
      `Style preset: ${input.preset.label}. ${input.preset.description}`,
      ``,
      `The next image is the finished banner design rendered by Nano Banana. Read it carefully and transcribe it into a BannerTree JSON. Match text content literally, positions and sizes in canvas pixels, fonts by their closest Google Font family, colours by pixel-sampling.`,
    ].join('\n'),
  });

  parts.push({
    inlineData: {
      mimeType: input.refImage.mimeType,
      data: input.refImage.bytes.toString('base64'),
    },
  });

  return [{ role: 'user', parts }];
}

function brandSummary(colors?: BrandColors | null, fonts?: BrandFonts | null): string {
  const lines: string[] = ['--- BRAND CONTEXT (ground truth — prefer over what you see in the image when in doubt) ---'];
  if (colors?.primary) lines.push(`  primary: ${colors.primary}`);
  if (colors?.secondary) lines.push(`  secondary: ${colors.secondary}`);
  if (colors?.accent) lines.push(`  accent: ${colors.accent}`);
  if (colors?.background) lines.push(`  background: ${colors.background}`);
  if (colors?.text) lines.push(`  text: ${colors.text}`);
  if (fonts?.headline) lines.push(`  headline font: ${fonts.headline}`);
  if (fonts?.body) lines.push(`  body font: ${fonts.body}`);
  if (lines.length === 1) lines.push('  (no brand defined — read colours/fonts from the image alone)');
  return lines.join('\n');
}
