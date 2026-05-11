import { z } from 'zod';
import type { BannerTree, Node } from './types';

const vec2 = z.object({ x: z.number(), y: z.number() });
const size = z.object({ w: z.number().nonnegative(), h: z.number().nonnegative() });
const frame = vec2.merge(size);

const fillSolid = z.object({
  kind: z.literal('solid'),
  color: z.string().min(1),
});

const fillLinear = z.object({
  kind: z.literal('linear'),
  angle: z.number(),
  stops: z
    .array(z.object({ at: z.number().min(0).max(1), color: z.string().min(1) }))
    .min(2),
});

const fillImage = z.object({
  kind: z.literal('image'),
  src: z.string().min(1),
  fit: z.enum(['cover', 'contain']),
});

const fill = z.discriminatedUnion('kind', [fillSolid, fillLinear, fillImage]);

const stroke = z.object({ width: z.number().nonnegative(), color: z.string() });

const shadow = z.object({
  x: z.number(),
  y: z.number(),
  blur: z.number().nonnegative(),
  spread: z.number().optional(),
  color: z.string(),
});

const fontSpec = z.object({
  family: z.string().min(1),
  weight: z.number().int().min(100).max(900),
  size: z.number().positive(),
  lineHeight: z.number().positive().optional(),
  letterSpacing: z.number().optional(),
  italic: z.boolean().optional(),
});

const baseFields = {
  id: z.string().min(1),
  name: z.string().optional(),
  frame,
  rotation: z.number().optional(),
  opacity: z.number().min(0).max(1).optional(),
  visible: z.boolean().optional(),
  locked: z.boolean().optional(),
};

const textNode = z.object({
  ...baseFields,
  type: z.literal('text'),
  text: z.string(),
  font: fontSpec,
  color: z.string(),
  align: z.enum(['left', 'center', 'right']),
});

const imageNode = z.object({
  ...baseFields,
  type: z.literal('image'),
  src: z.string().min(1),
  fit: z.enum(['cover', 'contain']),
  cornerRadius: z.number().nonnegative().optional(),
});

const shapeNode = z.object({
  ...baseFields,
  type: z.literal('shape'),
  variant: z.enum(['rect', 'ellipse']),
  fill: fill.optional(),
  stroke: stroke.optional(),
  cornerRadius: z.number().nonnegative().optional(),
  shadow: shadow.optional(),
});

const buttonNode = z.object({
  ...baseFields,
  type: z.literal('button'),
  label: z.string(),
  fill,
  textColor: z.string(),
  cornerRadius: z.number().nonnegative(),
  font: fontSpec,
  padding: z.object({ x: z.number().nonnegative(), y: z.number().nonnegative() }),
});

const stackLayout = z.object({
  mode: z.literal('stack'),
  direction: z.enum(['row', 'column']),
  gap: z.number().nonnegative(),
  padding: z.number().nonnegative(),
  align: z.enum(['start', 'center', 'end']),
  justify: z.enum(['start', 'center', 'end', 'between']),
});
const absoluteLayout = z.object({ mode: z.literal('absolute') });
const frameLayout = z.discriminatedUnion('mode', [stackLayout, absoluteLayout]);

// Recursive node schema using z.lazy for frame/group children.
const nodeSchema: z.ZodType<Node> = z.lazy(() =>
  z.discriminatedUnion('type', [
    textNode,
    imageNode,
    shapeNode,
    buttonNode,
    frameNodeSchema,
    groupNodeSchema,
  ]),
);

const frameNodeSchema = z.object({
  ...baseFields,
  type: z.literal('frame'),
  fill: fill.optional(),
  stroke: stroke.optional(),
  cornerRadius: z.number().nonnegative().optional(),
  clipsContent: z.boolean().optional(),
  layout: frameLayout.optional(),
  children: z.array(nodeSchema),
});

const groupNodeSchema = z.object({
  ...baseFields,
  type: z.literal('group'),
  children: z.array(nodeSchema),
});

export const bannerFontSchema = z.object({
  family: z.string().min(1),
  weights: z.array(z.number().int().min(100).max(900)).min(1),
});

export const bannerTreeSchema: z.ZodType<BannerTree> = z.object({
  schemaVersion: z.literal(1),
  canvas: z.object({
    width: z.number().positive(),
    height: z.number().positive(),
    background: fill.optional(),
  }),
  root: frameNodeSchema,
  fonts: z.array(bannerFontSchema).optional(),
});

export const nodeSchemaExport = nodeSchema;
