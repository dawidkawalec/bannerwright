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
    description: 'Architectural line-art + clean typography overlay.',
    bgPrompt:
      'Ultra-minimal background composition. Off-white or pale single-color surface with one subtle large geometric shape anchored to one corner. Lots of negative space. No text, no icons.',
    designPrompt:
      'Architectural line-art composition with a brand-coloured gradient wash. ONE hairline geometric form (Bauhaus circle, golden-ratio diagonal, single-stroke spiral, or quiet right-angle) anchored OFF-CENTRE. Pale cream / off-white / pale tinted surface — museum-poster quality, gallery-print restraint. Treat the brand palette as one accent colour, no decorative gradients beyond a soft surface tint. The composition must read as fine-art print, not a marketing template.',
    typographyHint:
      '\n\nStyle preset: MINIMALIST. Light font weights (300-400). Headline ≥ 80px. Generous letter-spacing on caps. Single accent colour for emphasis. 4-6 nodes total.',
    withBackground: true,
  },
  bold: {
    id: 'bold',
    label: 'Bold',
    description: 'Synthwave gradient mesh + heavy typography overlay.',
    bgPrompt:
      'Vibrant gradient mesh background — 2-3 saturated brand colors blending smoothly with soft organic blurred shapes. Slightly calmer in the centre for text overlay. No text, no icons.',
    designPrompt:
      'Synthwave-style gradient mesh composition built from the brand colours — vivid blends, organic blurred orbs, an asymmetric energy waveform or chromatic light leak. High-contrast saturation, scroll-stopping abstract shapes. Treat as album-cover or stage-visual art, NOT as a marketing template. The composition must be a single artistic piece with the brand palette dominant.',
    typographyHint:
      '\n\nStyle preset: BOLD. Heavy font weights (800-900). Headline ≥ 110px. Tight letter-spacing (-0.02em). High-contrast colour. CTA button solid bright fill. 5-8 nodes total.',
    withBackground: true,
  },
  editorial: {
    id: 'editorial',
    label: 'Editorial',
    description: 'Painterly editorial composition + serif typography overlay.',
    bgPrompt:
      'Editorial magazine-style background. Subtle textured paper or gallery wall, warm muted tones (cream, taupe, sand), slight grain, soft directional shadow. No text overlays, no icons.',
    designPrompt:
      'Painterly editorial composition — oil-paint or gouache texture in warm muted tones (cream, taupe, sand, ink, with brand colour as the accent). A single subject hint OFF-CENTRE (silhouette, abstract still-life, draped fabric, soft botanical, hand). Renaissance / mid-century gallery quality, fine grain. Read as a museum monograph cover, not as a social-media template.',
    typographyHint:
      '\n\nStyle preset: EDITORIAL. Serif headline (Playfair Display, Cormorant). Body sans-serif. Headline ≥ 72px. Warm muted text. 5-8 nodes total.',
    withBackground: true,
  },
  photographic: {
    id: 'photographic',
    label: 'Photographic',
    description: 'Cinematic on-brand photograph + typography overlay.',
    bgPrompt:
      'Photorealistic on-brand environment shot, cinematic lighting, depth-of-field. Balanced negative space for typography. No text, no icons.',
    designPrompt:
      'Cinematic lifestyle photograph on-brand environment — shallow depth-of-field, golden-hour or moody-overcast lighting, naturalistic colour grading. Compose with a naturally darker scrim region (deep shadow, dark wall, road surface, low-key fabric) where typography will sit. Magazine-cover quality, editorial photography aesthetic — never stock-photography composite.',
    typographyHint:
      '\n\nStyle preset: PHOTOGRAPHIC. Add a semi-transparent dark rect under the text for legibility. Bold white headline ≥ 90px. Minimal text. 3-5 nodes total.',
    withBackground: true,
  },
  glassmorphic: {
    id: 'glassmorphic',
    label: 'Glassmorphic',
    description: 'Glassmorphic data-viz + crisp typography overlay.',
    bgPrompt:
      'Modern fintech glassmorphic background. Frosted glass panels over a soft gradient mesh of brand colors. Subtle light leaks, blurred orbs. No text, no icons.',
    designPrompt:
      'Glassmorphic data-visualization composition — frosted translucent panels, floating UI chips, abstract chart fragments, blurred orbs and soft light leaks, layered over a gentle brand-colour gradient mesh. Dieter-Rams + Apple-keynote aesthetic, deep dark base or pristine light base. Treat as a product-keynote visual, NOT as a marketing template.',
    typographyHint:
      '\n\nStyle preset: GLASSMORPHIC. Medium weights, white text on a translucent rect. Headline ≥ 80px. 5-8 nodes total.',
    withBackground: true,
  },
  brutalist: {
    id: 'brutalist',
    label: 'Brutalist',
    description: 'Riso-print collage + monospace typography overlay.',
    bgPrompt:
      'Raw brutalist design background. Bold geometric blocks of brand colors, asymmetric, sharp edges. Concrete texture. No text, no icons.',
    designPrompt:
      'Riso-print collage with bold geometric blocks of brand colour — coarse paper grain, slight mis-registration, two- or three-colour spot-ink palette, asymmetric layout, sharp 90° edges. Anti-design / DIY-zine / Wim-Crouwel quality. Read as a screen-printed art print, not as a marketing template.',
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
 * Compose the pure-art Nano Banana prompt for the image-first pipeline.
 *
 * **Important contract change (Opcja A):** the model MUST NOT render any text,
 * headline copy, CTA pill, or label. The output is a single artistic
 * composition with intentional negative space; the server overlays editable
 * HTML text on top after Vision identifies the reserved zones. This avoids
 * NB's stock-template register and its broken Polish/diacritic rendering.
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
  const reservedZone = reservedZoneFor(format);
  const lines: string[] = [preset.designPrompt];

  lines.push(
    `\n--- CREATIVE BRIEF (for THEME only — do NOT render any of this text) ---\n${brief.trim()}`,
  );

  const palette: string[] = [];
  if (brandColors?.primary) palette.push(`primary ${brandColors.primary}`);
  if (brandColors?.secondary) palette.push(`secondary ${brandColors.secondary}`);
  if (brandColors?.accent) palette.push(`accent ${brandColors.accent}`);
  if (brandColors?.background) palette.push(`background ${brandColors.background}`);
  if (brandColors?.text) palette.push(`text ${brandColors.text}`);
  if (palette.length > 0) {
    lines.push(
      `\nBrand palette: ${palette.join(', ')}. These colours must dominate the artwork.`,
    );
  }
  if (brandFonts?.headline || brandFonts?.body) {
    lines.push(
      `Brand typographic character (informational only — do NOT render any letters): headline family character ${brandFonts.headline ?? 'sans-serif'}, body ${brandFonts.body ?? 'sans-serif'}.`,
    );
  }
  if (kbSnippet) {
    lines.push(
      `\nBrand voice & positioning (theme guidance only):\n${kbSnippet.slice(0, 600)}`,
    );
  }
  if (args.preset && palette.length === 0) {
    // No brand palette set yet — give the model an explicit pivot so it doesn't
    // default to grey/stock colours.
    lines.push(
      '\nNo brand palette supplied — invent a confident artistic palette (3-4 colours) that suits the theme.',
    );
  }
  lines.push(
    `\nOutput a single ${width}×${height}px ${aspect} image — the composition MUST fill this exact aspect ratio (do not return a square crop if the target is vertical or landscape).`,
  );
  lines.push(
    `NEGATIVE SPACE: at least 30-40% of the canvas MUST be visually quiet (single-tone, softly textured, or smoothly graduated) so the server can compose HTML typography on top later. Reserve the ${reservedZone} region for typography.`,
  );
  lines.push(
    'HARD PROHIBITIONS — violations make the output unusable: NO rendered text of any kind (no headline, no subhead, no CTA button, no caption, no watermark, no signature, no logo, no glyphs, no numbers, no letterforms anywhere). NO Canva-style template framing. NO photo-stock collage. NO clip-art icons. NO pill buttons. NO arrow CTAs. This is a piece of art, not a banner template.',
  );
  return lines.join(' ');
}

/**
 * Human hint for which canvas region should stay quiet for typography overlay.
 * Format-aware so vertical / landscape compositions don't all reserve the same
 * spot.
 */
function reservedZoneFor(format: GenerationFormat): string {
  switch (format) {
    case 'square_1080':
      return 'LEFT-CENTER or CENTER';
    case 'story_1080_1920':
      return 'LOWER-THIRD (bottom 35% of the canvas)';
    case 'landscape_1200_628':
      return 'RIGHT-COLUMN (right 40% of the canvas)';
    case 'portrait_1200_1500':
      return 'CENTER vertically, with the bottom 25% kept clean for a CTA';
  }
}
