import type { Content } from '@google/genai';
import type { BrandColors, GenerationFormat } from '@/lib/db/schema';
import { dimensionsFor } from '@/lib/renderer/formats';
import { generateContent } from '@/lib/ai/gemini';
import { logger } from '@/lib/logger';

export type ZoneRole = 'headline' | 'subhead' | 'cta';
export type ZoneScrim = 'dark' | 'light' | 'none';

export type TextZone = {
  role: ZoneRole;
  x: number;
  y: number;
  w: number;
  h: number;
  textColor: string;
  scrim: ZoneScrim;
  buttonFill?: string;
};

export const DETECT_TEXT_ZONES_SYSTEM = `You are an art director analyzing a finished AI-generated artistic composition that intentionally leaves negative space for typography. Your job is to decide WHERE on the canvas to place HTML text overlays so the final banner reads cleanly.

You return ONE JSON document matching the provided schema. No prose, no markdown fences.

For each zone return:
- role: "headline" (largest, most prominent) | "subhead" (secondary) | "cta" (smallest, action button)
- x, y, w, h: integer pixel rectangle on the canvas (origin top-left, w/h in pixels).
- textColor: hex (#RRGGBB) chosen for WCAG-AA contrast against the background under that exact rectangle (sample the dominant colour and pick near-white or near-black).
- scrim: "dark" — semi-transparent dark rect needed for legibility (the region behind the text is busy/light); "light" — semi-transparent white rect needed (busy/dark region); "none" — the region is already quiet enough.
- buttonFill: ONLY for role=="cta" — hex of the CTA button background fill. Prefer the supplied brand primary colour; fall back to a high-contrast colour sampled from the composition.

Hard rules — violations make the output unusable:
1. At least one zone with role "headline". There is always a primary text area.
2. Zones MUST NOT overlap each other.
3. Each zone is entirely inside the canvas (0 ≤ x, x+w ≤ canvasW, 0 ≤ y, y+h ≤ canvasH).
4. Honour rule-of-thirds composition: avoid cramming text into corners or against canvas edges. Leave at least 40px margin from each canvas edge.
5. Headline width should be 70-90% of the canvas width on square/portrait formats. On landscape banners headline width 50-70%.
6. Headline height (h) determines text size — pick a height that produces readable type (40-180px tall depending on canvas). Subhead h ≈ 0.4 × headline h. CTA h ≈ 56-96px regardless of canvas.
7. Return at most 3 zones.
8. Reply with ONLY the JSON document.`;

export const TEXT_ZONES_SCHEMA = {
  type: 'object',
  properties: {
    zones: {
      type: 'array',
      description: '1 to 3 non-overlapping zones for typography overlay.',
      items: {
        type: 'object',
        properties: {
          role: { type: 'string', enum: ['headline', 'subhead', 'cta'] },
          x: { type: 'number' },
          y: { type: 'number' },
          w: { type: 'number' },
          h: { type: 'number' },
          textColor: { type: 'string', description: 'Hex #RRGGBB' },
          scrim: { type: 'string', enum: ['dark', 'light', 'none'] },
          buttonFill: { type: 'string', description: 'Hex #RRGGBB. Only for role=cta.' },
        },
        required: ['role', 'x', 'y', 'w', 'h', 'textColor', 'scrim'],
      },
    },
  },
  required: ['zones'],
} as const;

export type DetectTextZonesInput = {
  refImage: { mimeType: string; bytes: Buffer };
  format: GenerationFormat;
  brandColors?: BrandColors | null;
  workspaceId?: string;
  /** Whether the brief explicitly wants a CTA. We use this to hint the model. */
  wantsCta?: boolean;
  /** Whether the brief explicitly has a subhead. */
  wantsSubhead?: boolean;
};

export async function detectTextZones(input: DetectTextZonesInput): Promise<TextZone[]> {
  const { width, height } = dimensionsFor(input.format);
  const contents = buildDetectZonesContents(input);

  const result = await generateContent({
    model: 'gemini-3.1-pro-preview',
    operation: 'detect_zones',
    workspaceId: input.workspaceId,
    systemInstruction: DETECT_TEXT_ZONES_SYSTEM,
    contents,
    responseSchema: TEXT_ZONES_SCHEMA,
  });

  const parsed = JSON.parse(stripFences(result.text)) as { zones: TextZone[] };
  const zones = Array.isArray(parsed?.zones) ? parsed.zones : [];
  const cleaned = sanitiseZones(zones, width, height);
  if (cleaned.length === 0 || !cleaned.some((z) => z.role === 'headline')) {
    throw new Error(
      `detectTextZones: model returned no usable zones (got ${zones.length}, sanitised ${cleaned.length}, no headline)`,
    );
  }
  logger.debug(
    { count: cleaned.length, roles: cleaned.map((z) => z.role) },
    'detectTextZones: zones detected',
  );
  return cleaned;
}

export function buildDetectZonesContents(input: DetectTextZonesInput): Content[] {
  const { width, height } = dimensionsFor(input.format);
  const palette: string[] = [];
  if (input.brandColors?.primary) palette.push(`primary ${input.brandColors.primary}`);
  if (input.brandColors?.secondary) palette.push(`secondary ${input.brandColors.secondary}`);
  if (input.brandColors?.accent) palette.push(`accent ${input.brandColors.accent}`);

  const expectedRoles = ['headline'];
  if (input.wantsSubhead) expectedRoles.push('subhead');
  if (input.wantsCta) expectedRoles.push('cta');

  const parts: Content['parts'] = [
    {
      text: [
        `--- TARGET CANVAS ---`,
        `${width}×${height} pixels (${input.format}).`,
        ``,
        palette.length > 0 ? `--- BRAND PALETTE ---\n${palette.join(', ')}.` : `--- BRAND PALETTE ---\n(none supplied; sample from the image)`,
        ``,
        `--- EXPECTED ROLES ---`,
        `The brief produced these copy slots: ${expectedRoles.join(', ')}. Try to return one zone per slot, but you may omit subhead/cta if no good negative space exists for them.`,
        ``,
        `The next image is the AI-generated artistic composition. Identify where to place HTML text overlay so the banner reads cleanly. Return zones in canvas pixel coordinates.`,
      ].join('\n'),
    },
    {
      inlineData: {
        mimeType: input.refImage.mimeType,
        data: input.refImage.bytes.toString('base64'),
      },
    },
  ];

  return [{ role: 'user', parts }];
}

function sanitiseZones(zones: TextZone[], canvasW: number, canvasH: number): TextZone[] {
  const out: TextZone[] = [];
  const seenRoles = new Set<ZoneRole>();
  for (const raw of zones) {
    const role = raw.role;
    if (role !== 'headline' && role !== 'subhead' && role !== 'cta') continue;
    if (seenRoles.has(role)) continue;
    const x = clampInt(raw.x, 0, canvasW - 1);
    const y = clampInt(raw.y, 0, canvasH - 1);
    const w = clampInt(raw.w, 1, canvasW - x);
    const h = clampInt(raw.h, 1, canvasH - y);
    if (w < 40 || h < 16) continue;
    const textColor = isHex(raw.textColor) ? raw.textColor : '#FFFFFF';
    const scrim: ZoneScrim = raw.scrim === 'dark' || raw.scrim === 'light' || raw.scrim === 'none'
      ? raw.scrim
      : 'none';
    const zone: TextZone = { role, x, y, w, h, textColor, scrim };
    if (role === 'cta' && isHex(raw.buttonFill)) zone.buttonFill = raw.buttonFill;
    if (overlapsAny(zone, out)) continue;
    out.push(zone);
    seenRoles.add(role);
  }
  // Stable sort: headline first, then subhead, then cta.
  const order: Record<ZoneRole, number> = { headline: 0, subhead: 1, cta: 2 };
  out.sort((a, b) => order[a.role] - order[b.role]);
  return out;
}

function clampInt(n: unknown, min: number, max: number): number {
  const v = typeof n === 'number' && Number.isFinite(n) ? Math.round(n) : min;
  return Math.max(min, Math.min(max, v));
}

function isHex(s: unknown): s is string {
  return typeof s === 'string' && /^#[0-9A-Fa-f]{6}$/.test(s);
}

function overlapsAny(a: TextZone, rest: TextZone[]): boolean {
  return rest.some(
    (b) => !(a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y),
  );
}

function stripFences(text: string): string {
  const trimmed = text.trim();
  const fenceMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)```$/i);
  return fenceMatch ? fenceMatch[1]!.trim() : trimmed;
}
