/**
 * Render a BannerTree to a complete, self-contained HTML document for headless
 * screenshotting. Pure string builder — does NOT use react-dom/server, so it
 * can be imported from Server Components / Server Actions / Route Handlers
 * under Next 16's `react-server` build condition.
 *
 * The output is structurally identical to what `<BannerRenderer />` produces
 * client-side: absolute-positioned divs with inline styles derived from typed
 * node props. The render-equivalence is asserted by a unit test (canvas DOM
 * snapshot vs. server string).
 */

import type {
  BannerFont,
  BannerTree,
  ButtonNode,
  Fill,
  FrameNode,
  GroupNode,
  ImageNode,
  Node,
  ShapeNode,
  Shadow,
  Stroke,
  TextNode,
} from './types';

export function renderTreeToHtml(tree: BannerTree): string {
  const { width, height, background } = tree.canvas;
  const fontImports = buildFontImports(tree.fonts ?? []);
  const rootStyle = styleString({
    position: 'relative',
    width: px(width),
    height: px(height),
    overflow: 'hidden',
    ...fillToStyle(background),
  });
  return [
    '<!DOCTYPE html>',
    '<html><head>',
    '<meta charset="utf-8"/>',
    `<meta name="viewport" content="width=${width}, height=${height}"/>`,
    '<style>',
    fontImports,
    'html,body{margin:0;padding:0;background:transparent;}',
    `body{width:${width}px;height:${height}px;}`,
    '</style>',
    '</head><body>',
    `<div data-banner-root="" style="${rootStyle}">`,
    tree.root.children.map(renderNode).join(''),
    '</div>',
    '</body></html>',
  ].join('');
}

function renderNode(node: Node): string {
  if (node.visible === false) return '';
  switch (node.type) {
    case 'text':
      return renderText(node);
    case 'image':
      return renderImage(node);
    case 'shape':
      return renderShape(node);
    case 'button':
      return renderButton(node);
    case 'frame':
      return renderFrame(node);
    case 'group':
      return renderGroup(node);
  }
}

function renderText(node: TextNode): string {
  const style = styleString({
    ...baseStyle(node),
    color: node.color,
    'font-family': cssFontFamily(node.font.family),
    'font-weight': String(node.font.weight),
    'font-size': px(node.font.size),
    'line-height': node.font.lineHeight != null ? String(node.font.lineHeight) : undefined,
    'letter-spacing':
      node.font.letterSpacing != null ? px(node.font.letterSpacing) : undefined,
    'font-style': node.font.italic ? 'italic' : undefined,
    'text-align': node.align,
    'white-space': 'pre-wrap',
    'word-break': 'break-word',
    display: 'flex',
    'flex-direction': 'column',
    'justify-content': 'flex-start',
  });
  return `<div style="${style}">${escapedTextWithBreaks(node.text)}</div>`;
}

function renderImage(node: ImageNode): string {
  const style = styleString({
    ...baseStyle(node),
    'object-fit': node.fit,
    'border-radius': node.cornerRadius != null ? px(node.cornerRadius) : undefined,
    display: 'block',
  });
  const alt = escapeAttr(node.name ?? '');
  const src = escapeAttr(node.src);
  return `<img src="${src}" alt="${alt}" style="${style}"/>`;
}

function renderShape(node: ShapeNode): string {
  const radius =
    node.variant === 'ellipse'
      ? '50%'
      : node.cornerRadius != null
        ? px(node.cornerRadius)
        : undefined;
  const style = styleString({
    ...baseStyle(node),
    ...fillToStyle(node.fill),
    border: strokeToBorder(node.stroke),
    'border-radius': radius,
    'box-shadow': shadowToCss(node.shadow),
  });
  return `<div style="${style}"></div>`;
}

function renderButton(node: ButtonNode): string {
  const style = styleString({
    ...baseStyle(node),
    ...fillToStyle(node.fill),
    color: node.textColor,
    'border-radius': px(node.cornerRadius),
    'font-family': cssFontFamily(node.font.family),
    'font-weight': String(node.font.weight),
    'font-size': px(node.font.size),
    'padding-top': px(node.padding.y),
    'padding-bottom': px(node.padding.y),
    'padding-left': px(node.padding.x),
    'padding-right': px(node.padding.x),
    display: 'flex',
    'align-items': 'center',
    'justify-content': 'center',
    'box-sizing': 'border-box',
    'text-align': 'center',
  });
  return `<div style="${style}">${escapeText(node.label)}</div>`;
}

function renderFrame(node: FrameNode): string {
  const stack = node.layout?.mode === 'stack' ? node.layout : null;
  const style = styleString({
    ...baseStyle(node),
    ...fillToStyle(node.fill),
    border: strokeToBorder(node.stroke),
    'border-radius': node.cornerRadius != null ? px(node.cornerRadius) : undefined,
    overflow: node.clipsContent ? 'hidden' : undefined,
    ...(stack
      ? {
          display: 'flex',
          'flex-direction': stack.direction,
          gap: px(stack.gap),
          padding: px(stack.padding),
          'align-items': alignToCss(stack.align),
          'justify-content': justifyToCss(stack.justify),
        }
      : null),
  });
  return `<div style="${style}">${node.children.map(renderNode).join('')}</div>`;
}

function renderGroup(node: GroupNode): string {
  const style = styleString(baseStyle(node));
  return `<div style="${style}">${node.children.map(renderNode).join('')}</div>`;
}

// ---------------------------------------------------------------------------
// Style helpers
// ---------------------------------------------------------------------------

type StyleMap = Record<string, string | undefined>;

function baseStyle(node: Node): StyleMap {
  const s: StyleMap = {
    position: 'absolute',
    left: px(node.frame.x),
    top: px(node.frame.y),
    width: px(node.frame.w),
    height: px(node.frame.h),
  };
  if (node.rotation) s.transform = `rotate(${node.rotation}deg)`;
  if (node.opacity != null && node.opacity !== 1) s.opacity = String(node.opacity);
  return s;
}

function fillToStyle(fill: Fill | undefined): StyleMap {
  if (!fill) return {};
  switch (fill.kind) {
    case 'solid':
      return { background: fill.color };
    case 'linear': {
      const stops = fill.stops
        .map((s) => `${s.color} ${Math.round(s.at * 100)}%`)
        .join(', ');
      return { background: `linear-gradient(${fill.angle}deg, ${stops})` };
    }
    case 'image':
      return {
        'background-image': `url("${cssUrl(fill.src)}")`,
        'background-size': fill.fit,
        'background-position': 'center',
        'background-repeat': 'no-repeat',
      };
  }
}

function strokeToBorder(stroke: Stroke | undefined): string | undefined {
  if (!stroke || stroke.width <= 0) return undefined;
  return `${stroke.width}px solid ${stroke.color}`;
}

function shadowToCss(shadow: Shadow | undefined): string | undefined {
  if (!shadow) return undefined;
  const spread = shadow.spread != null ? ` ${shadow.spread}px` : '';
  return `${shadow.x}px ${shadow.y}px ${shadow.blur}px${spread} ${shadow.color}`;
}

function cssFontFamily(family: string): string {
  return /["',]/.test(family) ? family : `"${family}", sans-serif`;
}

function cssUrl(src: string): string {
  return src.replace(/"/g, '\\"');
}

function alignToCss(a: 'start' | 'center' | 'end'): string {
  if (a === 'start') return 'flex-start';
  if (a === 'end') return 'flex-end';
  return 'center';
}

function justifyToCss(j: 'start' | 'center' | 'end' | 'between'): string {
  if (j === 'start') return 'flex-start';
  if (j === 'end') return 'flex-end';
  if (j === 'between') return 'space-between';
  return 'center';
}

function styleString(map: StyleMap): string {
  const parts: string[] = [];
  for (const key of Object.keys(map)) {
    const value = map[key];
    if (value == null || value === '') continue;
    parts.push(`${key}:${value}`);
  }
  return escapeAttr(parts.join(';'));
}


function px(n: number): string {
  return `${n}px`;
}

// ---------------------------------------------------------------------------
// Escape helpers
// ---------------------------------------------------------------------------

function escapeText(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeAttr(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapedTextWithBreaks(s: string): string {
  return s.split('\n').map(escapeText).join('<br/>');
}

// ---------------------------------------------------------------------------
// Google Fonts @import
// ---------------------------------------------------------------------------

function buildFontImports(fonts: BannerFont[]): string {
  if (fonts.length === 0) return '';
  const families = fonts
    .map((f) => {
      const weights = [...new Set(f.weights)].sort((a, b) => a - b).join(';');
      const family = f.family.replace(/\s+/g, '+');
      return `family=${family}:wght@${weights}`;
    })
    .join('&');
  return `@import url('https://fonts.googleapis.com/css2?${families}&display=swap');`;
}
