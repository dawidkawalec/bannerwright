/**
 * Visual style presets — each one bundles a Nano Banana background prompt and
 * a typography/composition hint for the Gemini tree generator. The user picks
 * a preset on the /generations/new form; the server passes the BG prompt to
 * Nano Banana first, then injects the typography hint into the tree system
 * instruction so the typography choices match the visual register.
 */

import type { BrandColors, GenerationFormat } from '@/lib/db/schema';
import { aspectLabel, dimensionsFor } from '@/lib/renderer/formats';

export const STYLE_PRESET_IDS = [
  'auto',
  'minimalist',
  'bold',
  'editorial',
  'photographic',
  'glassmorphic',
  'brutalist',
] as const;

export type StylePresetId = (typeof STYLE_PRESET_IDS)[number];

export type StylePreset = {
  id: StylePresetId;
  label: string;
  description: string;
  /** Legacy: background-only Nano Banana prompt (kept for the old code path). */
  bgPrompt: string;
  /**
   * Full-design Nano Banana prompt — describes the COMPLETE banner composition
   * (with text overlay, decorative elements, brand-feel) that the model should
   * paint. Used by the new image-first pipeline.
   */
  designPrompt: string;
  /** Appended to GENERATE_TREE_SYSTEM / ENCODE_DESIGN_SYSTEM so typography matches the visual. */
  typographyHint: string;
  /** Set false for `auto` — we let the model pick freely without a background. */
  withBackground: boolean;
};

export const STYLE_PRESETS: Record<StylePresetId, StylePreset> = {
  auto: {
    id: 'auto',
    label: 'Auto',
    description: 'Quick text-only draft (no Nano Banana). Cheapest, fastest, basic layout.',
    bgPrompt: '',
    designPrompt: '',
    typographyHint: '',
    withBackground: false,
  },
  minimalist: {
    id: 'minimalist',
    label: 'Minimalist',
    description: 'Lots of negative space, one accent colour, light typography.',
    bgPrompt:
      'Ultra-minimal background composition. Off-white or pale single-color surface with one subtle large geometric shape anchored to one corner. Lots of negative space. No text, no icons.',
    designPrompt:
      'A complete minimalist social-media banner design. Off-white or pale tinted surface with ONE strong geometric accent shape (large circle, diagonal line, or gradient blob) anchored to a corner. The headline is rendered in a LIGHT-weight modern sans-serif (300-400 weight), 80-110px size, perfectly placed in the empty space — generous letter-spacing on caps. Below it a small supporting line in muted grey. A small minimal CTA "Learn more" or similar in the corner — could be a tiny pill button or underlined text. Tasteful, gallery-quality, museum-poster feel. Use the supplied headline and copy literally.',
    typographyHint:
      '\n\nStyle preset: MINIMALIST. Light font weights (300-400). Headline ≥ 80px. Generous letter-spacing on caps. Single accent colour for emphasis. 4-6 nodes total.',
    withBackground: true,
  },
  bold: {
    id: 'bold',
    label: 'Bold',
    description: 'Vivid gradient, heavy typography, high contrast.',
    bgPrompt:
      'Vibrant gradient mesh background — 2-3 saturated brand colors blending smoothly with soft organic blurred shapes. Slightly calmer in the centre for text overlay. No text, no icons.',
    designPrompt:
      'A complete BOLD social-media banner design. Vivid gradient mesh in the brand colours fills the whole canvas. OVERSIZED headline in a heavy sans-serif (Inter Black, Montserrat 900, or similar) — 100-140px, ALL CAPS or sentence case, tight letter-spacing (-0.02em), placed prominently (often left-aligned, sometimes centred). Below it a supporting line in a lighter weight. A solid contrasting CTA button at the bottom (rounded rect with bold white text on dark fill, or vice versa). Optional 1-2 decorative geometric accents. Use the supplied headline and copy literally. High energy, scroll-stopping.',
    typographyHint:
      '\n\nStyle preset: BOLD. Heavy font weights (800-900). Headline ≥ 110px. Tight letter-spacing (-0.02em). High-contrast colour. CTA button solid bright fill. 5-8 nodes total.',
    withBackground: true,
  },
  editorial: {
    id: 'editorial',
    label: 'Editorial',
    description: 'Magazine-style, serif headline, warm muted tones.',
    bgPrompt:
      'Editorial magazine-style background. Subtle textured paper or gallery wall, warm muted tones (cream, taupe, sand), slight grain, soft directional shadow. No text overlays, no icons.',
    designPrompt:
      'A complete EDITORIAL magazine-style social-media banner design. Subtle textured paper or warm gallery-wall background in muted brand-adjacent tones (cream, taupe, sand, ink). A serif headline (Playfair Display, Cormorant Garamond, or Libre Caslon) at 72-100px, possibly with one word in italic — quietly luxurious. A small sans-serif sub-line beneath. Optional small editorial flourishes: a thin horizontal rule, a small page-number-style label, a tiny serif quote mark. CTA is text-only with an underline ("Read more →") or a quiet pill button. Use the supplied headline and copy literally. Sophisticated, fashion-magazine feel.',
    typographyHint:
      '\n\nStyle preset: EDITORIAL. Serif headline (Playfair Display, Cormorant). Body sans-serif. Headline ≥ 72px. Warm muted text. 5-8 nodes total.',
    withBackground: true,
  },
  photographic: {
    id: 'photographic',
    label: 'Photographic',
    description: 'Cinematic full-bleed photo with text overlay.',
    bgPrompt:
      'Photorealistic on-brand environment shot, cinematic lighting, depth-of-field. Balanced negative space for typography. No text, no icons.',
    designPrompt:
      'A complete PHOTOGRAPHIC social-media banner design. A photorealistic on-brand environment or product shot fills the canvas with cinematic lighting and shallow depth-of-field. A semi-transparent dark scrim (rect at ~50% opacity) sits under the text area for legibility. Bold sans-serif WHITE headline at 90-130px placed against the scrim. A small white supporting line below. A solid CTA button (rounded rect, bright brand colour) at the bottom. Use the supplied headline and copy literally. Magazine-cover quality.',
    typographyHint:
      '\n\nStyle preset: PHOTOGRAPHIC. Add a semi-transparent dark rect under the text for legibility. Bold white headline ≥ 90px. Minimal text. 3-5 nodes total.',
    withBackground: true,
  },
  glassmorphic: {
    id: 'glassmorphic',
    label: 'Glassmorphic',
    description: 'Frosted glass panels over a brand gradient mesh.',
    bgPrompt:
      'Modern fintech glassmorphic background. Frosted glass panels over a soft gradient mesh of brand colors. Subtle light leaks, blurred orbs. No text, no icons.',
    designPrompt:
      'A complete GLASSMORPHIC social-media banner design. A soft gradient mesh of brand colours with blurred orbs and light leaks fills the background. A rounded frosted-glass panel (semi-transparent white with subtle border and shadow) sits centred over the gradient and contains the text. Medium-weight white sans-serif headline (Inter, Plus Jakarta Sans) at 80-110px on the glass panel. A small lighter sub-line beneath. A bright solid CTA button at the bottom of the panel. Optional small icon accent. Use the supplied headline and copy literally. Modern fintech aesthetic.',
    typographyHint:
      '\n\nStyle preset: GLASSMORPHIC. Medium weights, white text on a translucent rect. Headline ≥ 80px. 5-8 nodes total.',
    withBackground: true,
  },
  brutalist: {
    id: 'brutalist',
    label: 'Brutalist',
    description: 'Raw geometric blocks, oversized monospace.',
    bgPrompt:
      'Raw brutalist design background. Bold geometric blocks of brand colors, asymmetric, sharp edges. Concrete texture. No text, no icons.',
    designPrompt:
      'A complete BRUTALIST social-media banner design. Two or three bold geometric blocks of brand colour (rectangles, sharp 90° edges) fill the canvas asymmetrically — concrete or coarse-paper texture. The headline is OVERSIZED monospace (Space Mono, JetBrains Mono, or Fira Code) at 130-170px, either lowercase or ALL-CAPS, broken across multiple lines, placed across the colour blocks. A small monospace sub-line in a contrasting block. Replace any CTA button with an underlined text link ("→ get started"). Use the supplied headline and copy literally. Industrial poster, anti-design feel.',
    typographyHint:
      '\n\nStyle preset: BRUTALIST. Space Mono / JetBrains Mono headline ≥ 130px. Monospace body. High contrast. Underlined text link instead of button. 3-5 nodes total.',
    withBackground: true,
  },
};

export function getPreset(id: StylePresetId | undefined | null): StylePreset {
  if (!id) return STYLE_PRESETS.auto;
  return STYLE_PRESETS[id] ?? STYLE_PRESETS.auto;
}

/**
 * Compose the final Nano Banana prompt: preset background spec + brand-colour
 * grounding. Returns null when the preset doesn't want a background (auto).
 */
export function buildBackgroundPrompt(
  preset: StylePreset,
  brandColors?: BrandColors | null,
): string | null {
  if (!preset.withBackground) return null;
  const lines: string[] = [preset.bgPrompt];
  const colors: string[] = [];
  if (brandColors?.primary) colors.push(`primary ${brandColors.primary}`);
  if (brandColors?.secondary) colors.push(`secondary ${brandColors.secondary}`);
  if (brandColors?.accent) colors.push(`accent ${brandColors.accent}`);
  if (colors.length > 0) {
    lines.push(`Brand palette: ${colors.join(', ')}. Use these colours faithfully.`);
  }
  lines.push(
    'Output a single 1:1 square image (1080×1080) suitable as a banner background. Negative space placed for typography overlay. No text rendered in the image.',
  );
  return lines.join(' ');
}

/**
 * Compose the full-design Nano Banana prompt for the image-first pipeline.
 * Includes the brief, brand context, preset design spec, and optional KB
 * voice/positioning hints. The output is a COMPLETE banner image (text + visual
 * + decorations) that Gemini Vision will then encode into an editable tree.
 */
export function buildDesignPrompt(args: {
  preset: StylePreset;
  brief: string;
  brandColors?: BrandColors | null;
  brandFonts?: { headline?: string; body?: string } | null;
  kbSnippet?: string;
  format: GenerationFormat;
}): string | null {
  const { preset, brief, brandColors, brandFonts, kbSnippet, format } = args;
  if (!preset.withBackground) return null;
  const { width, height } = dimensionsFor(format);
  const aspect = aspectLabel(format);
  const lines: string[] = [preset.designPrompt];

  lines.push(`\n--- CREATIVE BRIEF ---\n${brief.trim()}`);

  const palette: string[] = [];
  if (brandColors?.primary) palette.push(`primary ${brandColors.primary}`);
  if (brandColors?.secondary) palette.push(`secondary ${brandColors.secondary}`);
  if (brandColors?.accent) palette.push(`accent ${brandColors.accent}`);
  if (brandColors?.background) palette.push(`background ${brandColors.background}`);
  if (brandColors?.text) palette.push(`text ${brandColors.text}`);
  if (palette.length > 0) {
    lines.push(`\nBrand palette: ${palette.join(', ')}. Use these colours faithfully — they should dominate the design.`);
  }
  if (brandFonts?.headline || brandFonts?.body) {
    lines.push(
      `Brand fonts: headline ${brandFonts.headline ?? 'sans-serif'}, body ${brandFonts.body ?? 'sans-serif'}. Match the family character (geometric / humanist / serif / mono) even if the exact font is unavailable.`,
    );
  }
  if (kbSnippet) {
    lines.push(`\nBrand voice & context (from knowledge base):\n${kbSnippet.slice(0, 600)}`);
  }
  lines.push(
    `\nOutput a single ${width}×${height}px ${aspect} image — composition MUST fit this exact aspect ratio (do NOT render a square if the target is vertical or landscape). The banner is COMPLETE — render all text from the brief literally (headline, subhead, CTA copy). Do NOT add a logo placeholder unless the brief asks for it; leave the top-left corner clean for the user to place a logo later.`,
  );
  lines.push(
    'If the brief or copy contains Polish diacritics (ą ę ć ł ó ś ż ź ń, plus uppercase) or any other non-Latin glyphs (Cyrillic, accented Romance, etc.), render them precisely with correct accent marks — never substitute a base letter.',
  );
  return lines.join(' ');
}
