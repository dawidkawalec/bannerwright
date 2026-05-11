/**
 * Banner Tree — typed JSON model for visual editor.
 *
 * Source of truth for new generations. HTML is derived (export-only).
 * Node IDs are stable across AI edits (the contract: AI MUST preserve ids
 * for unchanged elements, same invariant as the legacy `data-bw-id` system).
 */

export type Vec2 = { x: number; y: number };
export type Size = { w: number; h: number };

export type FillSolid = { kind: 'solid'; color: string };
export type FillLinear = {
  kind: 'linear';
  angle: number;
  stops: Array<{ at: number; color: string }>;
};
export type FillImage = {
  kind: 'image';
  src: string;
  fit: 'cover' | 'contain';
};
export type Fill = FillSolid | FillLinear | FillImage;

export type Stroke = { width: number; color: string };

export type Shadow = {
  x: number;
  y: number;
  blur: number;
  spread?: number;
  color: string;
};

export type TextAlign = 'left' | 'center' | 'right';

export type FontSpec = {
  family: string;
  weight: number;
  size: number;
  lineHeight?: number;
  letterSpacing?: number;
  italic?: boolean;
};

type BaseNode = {
  id: string;
  name?: string;
  frame: Vec2 & Size;
  rotation?: number;
  opacity?: number;
  visible?: boolean;
  locked?: boolean;
};

export type TextNode = BaseNode & {
  type: 'text';
  text: string;
  font: FontSpec;
  color: string;
  align: TextAlign;
};

export type ImageNode = BaseNode & {
  type: 'image';
  src: string;
  fit: 'cover' | 'contain';
  cornerRadius?: number;
};

export type ShapeNode = BaseNode & {
  type: 'shape';
  variant: 'rect' | 'ellipse';
  fill?: Fill;
  stroke?: Stroke;
  cornerRadius?: number;
  shadow?: Shadow;
};

export type ButtonNode = BaseNode & {
  type: 'button';
  label: string;
  fill: Fill;
  textColor: string;
  cornerRadius: number;
  font: FontSpec;
  padding: { x: number; y: number };
};

export type StackLayout = {
  mode: 'stack';
  direction: 'row' | 'column';
  gap: number;
  padding: number;
  align: 'start' | 'center' | 'end';
  justify: 'start' | 'center' | 'end' | 'between';
};
export type AbsoluteLayout = { mode: 'absolute' };
export type FrameLayout = StackLayout | AbsoluteLayout;

export type FrameNode = BaseNode & {
  type: 'frame';
  fill?: Fill;
  stroke?: Stroke;
  cornerRadius?: number;
  clipsContent?: boolean;
  layout?: FrameLayout;
  children: Node[];
};

export type GroupNode = BaseNode & {
  type: 'group';
  children: Node[];
};

export type Node =
  | TextNode
  | ImageNode
  | ShapeNode
  | ButtonNode
  | FrameNode
  | GroupNode;

export type NodeType = Node['type'];

export type BannerFont = {
  family: string;
  weights: number[];
};

export type BannerTree = {
  schemaVersion: 1;
  canvas: { width: number; height: number; background?: Fill };
  root: FrameNode;
  fonts?: BannerFont[];
};

export const CURRENT_SCHEMA_VERSION = 1 as const;

export function isContainer(node: Node): node is FrameNode | GroupNode {
  return node.type === 'frame' || node.type === 'group';
}
