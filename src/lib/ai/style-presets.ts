/**
 * Visual style presets — each one bundles a Nano Banana background prompt and
 * a typography/composition hint for the Gemini tree generator. The user picks
 * a preset on the /generations/new form; the server passes the BG prompt to
 * Nano Banana first, then injects the typography hint into the tree system
 * instruction so the typography choices match the visual register.
 */

import type { BrandColors } from '@/lib/db/schema';

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
  /** Appended to the Nano Banana prompt before brand colors. */
  bgPrompt: string;
  /** Appended to GENERATE_TREE_SYSTEM so typography matches the visual. */
  typographyHint: string;
  /** Set false for `auto` — we let the model pick freely without a background. */
  withBackground: boolean;
};

export const STYLE_PRESETS: Record<StylePresetId, StylePreset> = {
  auto: {
    id: 'auto',
    label: 'Auto',
    description: 'No preset — model picks layout and decides whether to add a background.',
    bgPrompt: '',
    typographyHint: '',
    withBackground: false,
  },
  minimalist: {
    id: 'minimalist',
    label: 'Minimalist',
    description: 'Lots of negative space, one accent colour, light typography.',
    bgPrompt:
      'Ultra-minimal background composition. Off-white or pale single-color surface with one subtle large geometric shape (circle, diagonal line, soft gradient blob) anchored to one corner. Lots of negative space. No text, no icons, no busy patterns. Tasteful, gallery-quality.',
    typographyHint:
      '\n\nStyle preset: MINIMALIST. Use light font weights (300-400). Headline ≥ 80px on 1080 canvas. Generous letter-spacing on caps. Single accent colour for emphasis. Keep total nodes to 4-6. Lots of breathing room — no decorative shapes beyond what is needed.',
    withBackground: true,
  },
  bold: {
    id: 'bold',
    label: 'Bold',
    description: 'Vivid gradient mesh, heavy typography, high contrast.',
    bgPrompt:
      'Vibrant gradient mesh background — 2-3 saturated brand colors blending smoothly with soft organic blurred shapes. Slightly calmer in the centre so text overlays read. No text, no icons. High energy, attention-grabbing.',
    typographyHint:
      '\n\nStyle preset: BOLD. Use heavy font weights (800-900). Headline ≥ 110px on 1080 canvas. Tight letter-spacing (-0.02em). High-contrast colour (white on saturated background, or near-black on pale). CTA button uses a solid bright fill. 5-8 nodes total.',
    withBackground: true,
  },
  editorial: {
    id: 'editorial',
    label: 'Editorial',
    description: 'Magazine-style, serif headline, warm muted tones.',
    bgPrompt:
      'Editorial magazine-style background. Subtle textured paper or gallery wall, warm muted tones (cream, taupe, sand), slight grain, soft directional shadow. Sophisticated, fashion-magazine feel. No text overlays, no icons.',
    typographyHint:
      '\n\nStyle preset: EDITORIAL. Use a serif font for the headline (Playfair Display, Cormorant Garamond, or Libre Caslon). Body sans-serif (Inter, Work Sans). Headline ≥ 72px, italic accent words are encouraged. Warm muted text colours. Include the body fonts under "fonts". 5-8 nodes total.',
    withBackground: true,
  },
  photographic: {
    id: 'photographic',
    label: 'Photographic',
    description: 'Cinematic full-bleed photo background.',
    bgPrompt:
      'Photorealistic on-brand environment shot, cinematic lighting, soft depth-of-field. Balanced negative space in the centre or one third of the frame for typography overlay. Lifestyle/product photography quality, magazine-cover feel. No text overlays, no icons.',
    typographyHint:
      '\n\nStyle preset: PHOTOGRAPHIC. Place a subtle semi-transparent dark shape (rect, opacity 0.4-0.6) under the headline so text stays legible against the photo. Bold sans-serif white headline ≥ 90px. Keep total text minimal — let the photo breathe. CTA button optional, solid fill. 3-5 nodes total.',
    withBackground: true,
  },
  glassmorphic: {
    id: 'glassmorphic',
    label: 'Glassmorphic',
    description: 'Frosted glass panels over a brand-coloured gradient mesh.',
    bgPrompt:
      'Modern fintech glassmorphic background. Frosted glass panels floating over a soft gradient mesh of brand colors. Subtle light leaks, blurred orbs of colour. Centre of the frame stays clear for headline. No text, no logos, no icons.',
    typographyHint:
      '\n\nStyle preset: GLASSMORPHIC. Use medium font weights (500-600), white or near-white text colour. Headline ≥ 80px sans-serif (Inter or similar). Put text on a rounded translucent rect (kind: solid with rgba-equivalent dark/light fill at opacity ~0.4 via Fill) for legibility. 5-8 nodes total.',
    withBackground: true,
  },
  brutalist: {
    id: 'brutalist',
    label: 'Brutalist',
    description: 'Raw geometric blocks, oversized monospace.',
    bgPrompt:
      'Raw brutalist design background. Bold geometric blocks of color in the brand palette, asymmetric composition, sharp 90-degree edges. Concrete or coarse paper texture. Industrial poster feel. No text overlays, no icons.',
    typographyHint:
      '\n\nStyle preset: BRUTALIST. Use Space Mono or JetBrains Mono for the headline. Oversized headline (≥ 130px), tight tracking, lowercase or ALL-CAPS. Monospace body too. High contrast (black on bright colour or white on dark). Replace CTA button with an underlined text link. 3-5 nodes total.',
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
