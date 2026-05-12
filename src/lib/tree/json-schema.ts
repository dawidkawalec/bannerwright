/**
 * Gemini `responseSchema` (subset of OpenAPI 3) for BannerTree.
 *
 * We keep the schema flat (no discriminated unions / oneOf) because Gemini
 * historically misbehaves on nested oneOf. Every node carries a `type` enum
 * plus the union of all possible type-specific fields as optional. Strict
 * validation is done with Zod after the model responds; invalid trees trigger
 * a retry with the validation error appended to the prompt.
 *
 * Recursion limit: Gemini doesn't support `$ref`, so we materialise the node
 * shape up to a fixed depth. 4 levels is plenty for banners.
 */

type GeminiSchema = Record<string, unknown>;

const fillSchema: GeminiSchema = {
  type: 'object',
  properties: {
    kind: { type: 'string', enum: ['solid', 'linear', 'image'] },
    color: { type: 'string', description: 'Hex color, used for solid fill.' },
    angle: { type: 'number', description: 'Degrees, used for linear gradient.' },
    stops: {
      type: 'array',
      description: 'Gradient stops (for kind=linear). 2+ entries.',
      items: {
        type: 'object',
        properties: {
          at: { type: 'number', description: '0..1' },
          color: { type: 'string' },
        },
        required: ['at', 'color'],
      },
    },
    src: { type: 'string', description: 'Image URL, used for kind=image.' },
    fit: { type: 'string', enum: ['cover', 'contain'] },
  },
  required: ['kind'],
};

const strokeSchema: GeminiSchema = {
  type: 'object',
  properties: {
    width: { type: 'number' },
    color: { type: 'string' },
  },
  required: ['width', 'color'],
};

const shadowSchema: GeminiSchema = {
  type: 'object',
  properties: {
    x: { type: 'number' },
    y: { type: 'number' },
    blur: { type: 'number' },
    spread: { type: 'number' },
    color: { type: 'string' },
  },
  required: ['x', 'y', 'blur', 'color'],
};

const fontSpecSchema: GeminiSchema = {
  type: 'object',
  properties: {
    family: { type: 'string' },
    weight: { type: 'integer', description: '100..900' },
    size: { type: 'number' },
    lineHeight: { type: 'number' },
    letterSpacing: { type: 'number' },
    italic: { type: 'boolean' },
  },
  required: ['family', 'weight', 'size'],
};

const layoutSchema: GeminiSchema = {
  type: 'object',
  properties: {
    mode: { type: 'string', enum: ['absolute', 'stack'] },
    direction: { type: 'string', enum: ['row', 'column'] },
    gap: { type: 'number' },
    padding: { type: 'number' },
    align: { type: 'string', enum: ['start', 'center', 'end'] },
    justify: { type: 'string', enum: ['start', 'center', 'end', 'between'] },
  },
  required: ['mode'],
};

const NODE_TYPES = ['text', 'image', 'shape', 'button', 'frame', 'group'] as const;

function nodeSchemaAtDepth(maxChildDepth: number): GeminiSchema {
  const props: GeminiSchema = {
    id: { type: 'string', description: 'Stable nanoid. Preserve across edits when this node is unchanged.' },
    name: { type: 'string', description: 'Optional human label for Layers panel.' },
    type: { type: 'string', enum: [...NODE_TYPES] },
    frame: {
      type: 'object',
      properties: {
        x: { type: 'number' },
        y: { type: 'number' },
        w: { type: 'number' },
        h: { type: 'number' },
      },
      required: ['x', 'y', 'w', 'h'],
    },
    rotation: { type: 'number', description: 'Degrees, default 0.' },
    opacity: { type: 'number', description: '0..1, default 1.' },
    visible: { type: 'boolean' },
    locked: { type: 'boolean' },

    // text-specific
    text: { type: 'string', description: 'Used by type=text. \\n preserved as line break.' },
    color: { type: 'string', description: 'Hex color. Used by type=text for text color.' },
    align: { type: 'string', enum: ['left', 'center', 'right'] },
    font: fontSpecSchema,

    // image / image-fill
    src: { type: 'string', description: 'Image URL. Used by type=image.' },
    fit: { type: 'string', enum: ['cover', 'contain'] },
    cornerRadius: { type: 'number' },

    // shape
    variant: { type: 'string', enum: ['rect', 'ellipse'], description: 'Used by type=shape.' },
    fill: fillSchema,
    stroke: strokeSchema,
    shadow: shadowSchema,

    // button
    label: { type: 'string', description: 'Used by type=button.' },
    textColor: { type: 'string', description: 'Used by type=button.' },
    padding: {
      type: 'object',
      properties: { x: { type: 'number' }, y: { type: 'number' } },
      required: ['x', 'y'],
    },

    // frame
    clipsContent: { type: 'boolean' },
    layout: layoutSchema,
  };

  if (maxChildDepth > 0) {
    props.children = {
      type: 'array',
      description: 'Used by type=frame and type=group.',
      items: nodeSchemaAtDepth(maxChildDepth - 1),
    };
  }

  return {
    type: 'object',
    properties: props,
    required: ['id', 'type', 'frame'],
  };
}

/**
 * Top-level BannerTree schema. Depth 3 is the maximum Gemini accepts for
 * inline-recursive responseSchemas (depth 4 returns INVALID_ARGUMENT — the
 * total nested-object count exceeds its limit). Banners virtually never need
 * more than root + 3 levels of nested frames/groups.
 */
export const BANNER_TREE_JSON_SCHEMA: GeminiSchema = {
  type: 'object',
  properties: {
    schemaVersion: { type: 'integer', description: 'Must be 1.' },
    canvas: {
      type: 'object',
      properties: {
        width: { type: 'number' },
        height: { type: 'number' },
        background: fillSchema,
      },
      required: ['width', 'height'],
    },
    root: nodeSchemaAtDepth(3),
    fonts: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          family: { type: 'string' },
          weights: { type: 'array', items: { type: 'integer' } },
        },
        required: ['family', 'weights'],
      },
    },
  },
  required: ['schemaVersion', 'canvas', 'root'],
};
