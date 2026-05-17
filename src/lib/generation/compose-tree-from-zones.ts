import { newNodeId } from '@/lib/tree/id';
import type { TextZone } from '@/lib/ai/prompts/detect-text-zones';
import type { BrandColors, BrandFonts, GenerationFormat } from '@/lib/db/schema';
import { dimensionsFor } from '@/lib/renderer/formats';
import type { BriefStructure } from '@/lib/ai/extract-brief-structure';
import type {
  BannerFont,
  BannerTree,
  ButtonNode,
  FrameNode,
  Node,
  ShapeNode,
  TextNode,
} from '@/lib/tree/types';

const DEFAULT_HEADLINE_FONT = 'Inter';
const DEFAULT_BODY_FONT = 'Inter';
const FALLBACK_PRIMARY = '#111827';

type ComposeArgs = {
  zones: TextZone[];
  structure: BriefStructure;
  brandColors?: BrandColors | null;
  brandFonts?: BrandFonts | null;
  format: GenerationFormat;
  /** data: URI of the Nano Banana art composition — used as the canvas background. */
  refImageDataUri: string;
};

/**
 * Build a BannerTree from Vision-detected zones + structured brief copy.
 *
 * Contract (Opcja A — pure-art NB + HTML overlay):
 *   canvas.background = the Nano Banana artwork as an image fill
 *   children = scrims, text nodes, and CTA button placed inside the detected
 *              zones. The output is a valid BannerTree ready for tree-render
 *              and for the visual editor — every text is real HTML so Polish
 *              diacritics and brand fonts render crisply.
 */
export function composeTreeFromZones(args: ComposeArgs): BannerTree {
  const { width, height } = dimensionsFor(args.format);
  const headlineFont = nonEmpty(args.brandFonts?.headline) ?? DEFAULT_HEADLINE_FONT;
  const bodyFont = nonEmpty(args.brandFonts?.body) ?? DEFAULT_BODY_FONT;
  const primary = nonEmpty(args.brandColors?.primary) ?? FALLBACK_PRIMARY;

  const zonesByRole = new Map<TextZone['role'], TextZone>();
  for (const z of args.zones) {
    if (!zonesByRole.has(z.role)) zonesByRole.set(z.role, z);
  }

  const headlineZone = zonesByRole.get('headline') ?? defaultHeadlineZone(width, height);
  const subheadZone = args.structure.subhead
    ? zonesByRole.get('subhead') ?? fallbackBelow(headlineZone, 'subhead', width, height)
    : undefined;
  const ctaZone = args.structure.cta
    ? zonesByRole.get('cta') ?? fallbackBelow(subheadZone ?? headlineZone, 'cta', width, height)
    : undefined;

  const children: Node[] = [];

  pushZoneNodes(children, {
    zone: headlineZone,
    role: 'headline',
    text: args.structure.headline,
    fontFamily: headlineFont,
    fontWeight: 700,
    fontSize: clamp(headlineZone.h * 0.6, 28, 140),
    primary,
  });

  if (subheadZone && args.structure.subhead) {
    pushZoneNodes(children, {
      zone: subheadZone,
      role: 'subhead',
      text: args.structure.subhead,
      fontFamily: bodyFont,
      fontWeight: 500,
      fontSize: clamp(subheadZone.h * 0.55, 18, 64),
      primary,
    });
  }

  if (ctaZone && args.structure.cta) {
    pushZoneNodes(children, {
      zone: ctaZone,
      role: 'cta',
      text: args.structure.cta,
      fontFamily: bodyFont,
      fontWeight: 600,
      fontSize: clamp(ctaZone.h * 0.4, 14, 24),
      primary,
    });
  }

  const root: FrameNode = {
    id: newNodeId(),
    type: 'frame',
    name: 'Root',
    frame: { x: 0, y: 0, w: width, h: height },
    layout: { mode: 'absolute' },
    children,
  };

  const fonts: BannerFont[] = uniqueByFamily([
    { family: headlineFont, weights: [400, 500, 700] },
    { family: bodyFont, weights: [400, 500, 600, 700] },
  ]);

  return {
    schemaVersion: 1,
    canvas: {
      width,
      height,
      background: { kind: 'image', src: args.refImageDataUri, fit: 'cover' },
    },
    root,
    fonts,
  };
}

type ZoneNodeArgs = {
  zone: TextZone;
  role: TextZone['role'];
  text: string;
  fontFamily: string;
  fontWeight: number;
  fontSize: number;
  primary: string;
};

function pushZoneNodes(out: Node[], a: ZoneNodeArgs): void {
  const scrim = buildScrim(a.zone);
  if (scrim) out.push(scrim);

  if (a.role === 'cta') {
    out.push(buildButton(a));
  } else {
    out.push(buildText(a));
  }
}

function buildScrim(zone: TextZone): ShapeNode | undefined {
  if (zone.scrim === 'none') return undefined;
  const pad = 12;
  return {
    id: newNodeId(),
    type: 'shape',
    name: `${zone.role}-scrim`,
    frame: {
      x: Math.max(0, zone.x - pad),
      y: Math.max(0, zone.y - pad),
      w: zone.w + pad * 2,
      h: zone.h + pad * 2,
    },
    variant: 'rect',
    cornerRadius: 8,
    opacity: zone.scrim === 'dark' ? 0.45 : 0.55,
    fill: {
      kind: 'solid',
      color: zone.scrim === 'dark' ? '#000000' : '#FFFFFF',
    },
  };
}

function buildText(a: ZoneNodeArgs): TextNode {
  return {
    id: newNodeId(),
    type: 'text',
    name: a.role,
    frame: { x: a.zone.x, y: a.zone.y, w: a.zone.w, h: a.zone.h },
    text: a.text,
    color: a.zone.textColor,
    align: 'left',
    font: {
      family: a.fontFamily,
      weight: a.fontWeight,
      size: a.fontSize,
      lineHeight: 1.15,
    },
  };
}

function buildButton(a: ZoneNodeArgs): ButtonNode {
  const fillColor = a.zone.buttonFill ?? a.primary;
  return {
    id: newNodeId(),
    type: 'button',
    name: 'cta',
    frame: { x: a.zone.x, y: a.zone.y, w: a.zone.w, h: a.zone.h },
    label: a.text,
    fill: { kind: 'solid', color: fillColor },
    textColor: a.zone.textColor,
    cornerRadius: Math.round(a.zone.h / 2),
    font: {
      family: a.fontFamily,
      weight: a.fontWeight,
      size: a.fontSize,
    },
    padding: { x: 24, y: 12 },
  };
}

function defaultHeadlineZone(canvasW: number, canvasH: number): TextZone {
  // Center-band fallback when Vision returns no headline (should be blocked by
  // sanitiseZones; this is a defence-in-depth last resort).
  const w = Math.round(canvasW * 0.8);
  const h = Math.round(canvasH * 0.18);
  return {
    role: 'headline',
    x: Math.round((canvasW - w) / 2),
    y: Math.round((canvasH - h) / 2),
    w,
    h,
    textColor: '#FFFFFF',
    scrim: 'dark',
  };
}

function fallbackBelow(
  anchor: TextZone | undefined,
  role: TextZone['role'],
  canvasW: number,
  canvasH: number,
): TextZone {
  const base = anchor ?? defaultHeadlineZone(canvasW, canvasH);
  const gap = 24;
  const h = role === 'cta' ? 72 : Math.round(base.h * 0.4);
  const w = role === 'cta' ? Math.min(base.w, 320) : base.w;
  let y = base.y + base.h + gap;
  if (y + h > canvasH - 40) y = canvasH - h - 40;
  return {
    role,
    x: base.x,
    y,
    w,
    h,
    textColor: base.textColor,
    scrim: base.scrim,
    ...(role === 'cta' ? { buttonFill: base.textColor === '#000000' ? '#111827' : '#FFFFFF' } : {}),
  };
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.round(n)));
}

function nonEmpty(s: string | undefined | null): string | undefined {
  if (typeof s !== 'string') return undefined;
  const t = s.trim();
  return t.length > 0 ? t : undefined;
}

function uniqueByFamily(fonts: BannerFont[]): BannerFont[] {
  const seen = new Map<string, BannerFont>();
  for (const f of fonts) {
    const existing = seen.get(f.family);
    if (existing) {
      const merged = Array.from(new Set([...existing.weights, ...f.weights])).sort();
      seen.set(f.family, { family: f.family, weights: merged });
    } else {
      seen.set(f.family, f);
    }
  }
  return Array.from(seen.values());
}
