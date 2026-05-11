import type { CSSProperties, ReactNode } from 'react';
import { Fragment } from 'react';
import type {
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

/**
 * BannerRenderer — single source of truth for visual output.
 *
 * Used in two contexts with identical output:
 *   1) Interactive canvas in the editor (each node gets `data-node-id`).
 *   2) Headless SSR for PNG export via `renderToStaticMarkup`.
 *
 * Style is generated inline from typed node props — no arbitrary CSS strings,
 * no styled-components. The component is pure and isomorphic.
 */

export type BannerRendererProps = {
  tree: BannerTree;
  /** If true (default), emits `data-node-id` on every element for click-select. */
  withNodeIds?: boolean;
};

export function BannerRenderer({ tree, withNodeIds = true }: BannerRendererProps) {
  const { width, height, background } = tree.canvas;
  const style: CSSProperties = {
    position: 'relative',
    width,
    height,
    overflow: 'hidden',
    ...fillToStyle(background),
  };
  return (
    <div data-banner-root="" style={style}>
      {tree.root.children.map((child) => (
        <NodeView key={child.id} node={child} withNodeIds={withNodeIds} />
      ))}
    </div>
  );
}

function NodeView({ node, withNodeIds }: { node: Node; withNodeIds: boolean }) {
  if (node.visible === false) return null;
  switch (node.type) {
    case 'text':
      return <TextView node={node} withNodeIds={withNodeIds} />;
    case 'image':
      return <ImageView node={node} withNodeIds={withNodeIds} />;
    case 'shape':
      return <ShapeView node={node} withNodeIds={withNodeIds} />;
    case 'button':
      return <ButtonView node={node} withNodeIds={withNodeIds} />;
    case 'frame':
      return <FrameView node={node} withNodeIds={withNodeIds} />;
    case 'group':
      return <GroupView node={node} withNodeIds={withNodeIds} />;
  }
}

function baseStyle(node: Node): CSSProperties {
  const s: CSSProperties = {
    position: 'absolute',
    left: node.frame.x,
    top: node.frame.y,
    width: node.frame.w,
    height: node.frame.h,
  };
  if (node.rotation) s.transform = `rotate(${node.rotation}deg)`;
  if (node.opacity != null && node.opacity !== 1) s.opacity = node.opacity;
  return s;
}

function dataProps(node: Node, withNodeIds: boolean): Record<string, string> {
  return withNodeIds ? { 'data-node-id': node.id, 'data-node-type': node.type } : {};
}

function TextView({ node, withNodeIds }: { node: TextNode; withNodeIds: boolean }) {
  const style: CSSProperties = {
    ...baseStyle(node),
    color: node.color,
    fontFamily: cssFontFamily(node.font.family),
    fontWeight: node.font.weight,
    fontSize: node.font.size,
    lineHeight: node.font.lineHeight,
    letterSpacing: node.font.letterSpacing,
    fontStyle: node.font.italic ? 'italic' : undefined,
    textAlign: node.align,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start',
  };
  return (
    <div style={style} {...dataProps(node, withNodeIds)}>
      {renderText(node.text)}
    </div>
  );
}

function renderText(text: string): ReactNode {
  const lines = text.split('\n');
  return lines.map((line, i) => (
    <Fragment key={i}>
      {line}
      {i < lines.length - 1 ? <br /> : null}
    </Fragment>
  ));
}

function ImageView({ node, withNodeIds }: { node: ImageNode; withNodeIds: boolean }) {
  const style: CSSProperties = {
    ...baseStyle(node),
    objectFit: node.fit,
    borderRadius: node.cornerRadius,
    display: 'block',
  };
  return (
    // eslint-disable-next-line @next/next/no-img-element -- banner output must be plain HTML for Playwright PNG render
    <img src={node.src} alt={node.name ?? ''} style={style} {...dataProps(node, withNodeIds)} />
  );
}

function ShapeView({ node, withNodeIds }: { node: ShapeNode; withNodeIds: boolean }) {
  const radius =
    node.variant === 'ellipse'
      ? '50%'
      : node.cornerRadius != null
        ? `${node.cornerRadius}px`
        : undefined;
  const style: CSSProperties = {
    ...baseStyle(node),
    ...fillToStyle(node.fill),
    border: strokeToBorder(node.stroke),
    borderRadius: radius,
    boxShadow: shadowToCss(node.shadow),
  };
  return <div style={style} {...dataProps(node, withNodeIds)} />;
}

function ButtonView({ node, withNodeIds }: { node: ButtonNode; withNodeIds: boolean }) {
  const style: CSSProperties = {
    ...baseStyle(node),
    ...fillToStyle(node.fill),
    color: node.textColor,
    borderRadius: node.cornerRadius,
    fontFamily: cssFontFamily(node.font.family),
    fontWeight: node.font.weight,
    fontSize: node.font.size,
    lineHeight: node.font.lineHeight,
    letterSpacing: node.font.letterSpacing,
    paddingTop: node.padding.y,
    paddingBottom: node.padding.y,
    paddingLeft: node.padding.x,
    paddingRight: node.padding.x,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxSizing: 'border-box',
    textAlign: 'center',
  };
  return (
    <div style={style} {...dataProps(node, withNodeIds)}>
      {node.label}
    </div>
  );
}

function FrameView({ node, withNodeIds }: { node: FrameNode; withNodeIds: boolean }) {
  const stack = node.layout?.mode === 'stack' ? node.layout : null;
  const style: CSSProperties = {
    ...baseStyle(node),
    ...fillToStyle(node.fill),
    border: strokeToBorder(node.stroke),
    borderRadius: node.cornerRadius,
    overflow: node.clipsContent ? 'hidden' : undefined,
    ...(stack
      ? {
          display: 'flex',
          flexDirection: stack.direction,
          gap: stack.gap,
          padding: stack.padding,
          alignItems: alignToCss(stack.align),
          justifyContent: justifyToCss(stack.justify),
        }
      : null),
  };
  return (
    <div style={style} {...dataProps(node, withNodeIds)}>
      {node.children.map((c) => (
        <NodeView key={c.id} node={c} withNodeIds={withNodeIds} />
      ))}
    </div>
  );
}

function GroupView({ node, withNodeIds }: { node: GroupNode; withNodeIds: boolean }) {
  const style: CSSProperties = baseStyle(node);
  return (
    <div style={style} {...dataProps(node, withNodeIds)}>
      {node.children.map((c) => (
        <NodeView key={c.id} node={c} withNodeIds={withNodeIds} />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Style helpers
// ---------------------------------------------------------------------------

function fillToStyle(fill: Fill | undefined): CSSProperties {
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
        backgroundImage: `url(${cssUrl(fill.src)})`,
        backgroundSize: fill.fit,
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
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

function alignToCss(a: 'start' | 'center' | 'end'): CSSProperties['alignItems'] {
  if (a === 'start') return 'flex-start';
  if (a === 'end') return 'flex-end';
  return 'center';
}

function justifyToCss(j: 'start' | 'center' | 'end' | 'between'): CSSProperties['justifyContent'] {
  if (j === 'start') return 'flex-start';
  if (j === 'end') return 'flex-end';
  if (j === 'between') return 'space-between';
  return 'center';
}
