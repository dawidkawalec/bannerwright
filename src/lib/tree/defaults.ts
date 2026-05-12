/**
 * Fill in sensible defaults for fields the AI may omit when generating a tree.
 *
 * Gemini's structured-output schema (`BANNER_TREE_JSON_SCHEMA`) is flat — it
 * marks only `id`/`type`/`frame` as required on every node, because we can't
 * express type-conditional `required` arrays in the OpenAPI subset Gemini
 * accepts. The Zod schema is stricter (e.g. text nodes need `font`, `color`,
 * `align`). This preprocessor bridges the gap: walks the raw model output and
 * fills in safe defaults so Zod validation passes for "good enough" trees.
 *
 * Defaults are intentionally bland (Inter 400, black text, solid white fill).
 * AI is still expected to do the design work — this only catches forgotten
 * fields, not missing intent.
 */

type RawNode = Record<string, unknown> & { type?: string; children?: unknown[] };

export function applyTreeDefaults(input: unknown): unknown {
  if (!input || typeof input !== 'object') return input;
  const root = (input as { root?: unknown }).root;
  if (root && typeof root === 'object') {
    fillNode(root as RawNode);
  }
  return input;
}

function fillNode(node: RawNode): void {
  switch (node.type) {
    case 'text':
      ensure(node, 'text', '');
      ensure(node, 'color', '#000000');
      ensure(node, 'align', 'left');
      if (!isObject(node.font)) node.font = {};
      ensure(node.font as RawNode, 'family', 'Inter');
      ensure(node.font as RawNode, 'weight', 400);
      ensure(node.font as RawNode, 'size', 32);
      break;
    case 'image':
      ensure(node, 'src', '');
      ensure(node, 'fit', 'cover');
      break;
    case 'shape':
      ensure(node, 'variant', 'rect');
      break;
    case 'button':
      ensure(node, 'label', 'Button');
      ensure(node, 'textColor', '#FFFFFF');
      ensure(node, 'cornerRadius', 8);
      if (!isObject(node.fill)) node.fill = { kind: 'solid', color: '#111827' };
      if (!isObject(node.font)) node.font = {};
      ensure(node.font as RawNode, 'family', 'Inter');
      ensure(node.font as RawNode, 'weight', 600);
      ensure(node.font as RawNode, 'size', 16);
      if (!isObject(node.padding)) node.padding = { x: 16, y: 8 };
      break;
    case 'frame':
    case 'group':
      if (!Array.isArray(node.children)) node.children = [];
      break;
  }
  if (Array.isArray(node.children)) {
    for (const child of node.children) {
      if (isObject(child)) fillNode(child as RawNode);
    }
  }
}

function ensure<T extends Record<string, unknown>>(obj: T, key: string, fallback: unknown): void {
  if (obj[key] === undefined || obj[key] === null) {
    (obj as Record<string, unknown>)[key] = fallback;
  }
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}
