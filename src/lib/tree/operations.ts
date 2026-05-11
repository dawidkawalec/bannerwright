import type { BannerTree, FrameNode, GroupNode, Node, NodeType, Vec2, Size } from './types';
import { isContainer } from './types';
import { newNodeId } from './id';

/**
 * Pure tree operations. All functions take a tree and return a NEW tree —
 * no in-place mutation. Designed to compose inside an Immer producer or be
 * called directly from server code.
 *
 * Lookups walk the tree (O(n)); banners have <100 nodes typically so this is
 * fine. If we ever need O(1) lookup we'll add a flat-map cache.
 */

// ---------------------------------------------------------------------------
// Lookup
// ---------------------------------------------------------------------------

export function findNode(tree: BannerTree, id: string): Node | null {
  return findNodeIn(tree.root, id);
}

function findNodeIn(node: Node, id: string): Node | null {
  if (node.id === id) return node;
  if (isContainer(node)) {
    for (const child of node.children) {
      const found = findNodeIn(child, id);
      if (found) return found;
    }
  }
  return null;
}

export function findParent(tree: BannerTree, id: string): FrameNode | GroupNode | null {
  if (tree.root.id === id) return null;
  return findParentIn(tree.root, id);
}

function findParentIn(node: Node, id: string): FrameNode | GroupNode | null {
  if (!isContainer(node)) return null;
  for (const child of node.children) {
    if (child.id === id) return node;
    const deep = findParentIn(child, id);
    if (deep) return deep;
  }
  return null;
}

export function listIds(tree: BannerTree): string[] {
  const ids: string[] = [];
  walk(tree.root, (n) => ids.push(n.id));
  return ids;
}

export function walk(node: Node, visit: (n: Node) => void): void {
  visit(node);
  if (isContainer(node)) {
    for (const c of node.children) walk(c, visit);
  }
}

// ---------------------------------------------------------------------------
// Transforms (pure: return new node/tree)
// ---------------------------------------------------------------------------

export function mapNode(
  tree: BannerTree,
  id: string,
  patch: (node: Node) => Node,
): BannerTree {
  return { ...tree, root: mapNodeIn(tree.root, id, patch) as FrameNode };
}

function mapNodeIn(node: Node, id: string, patch: (n: Node) => Node): Node {
  if (node.id === id) return patch(node);
  if (isContainer(node)) {
    return {
      ...node,
      children: node.children.map((c) => mapNodeIn(c, id, patch)),
    };
  }
  return node;
}

export function setNodePatch<T extends Partial<Node>>(
  tree: BannerTree,
  id: string,
  patch: T,
): BannerTree {
  return mapNode(tree, id, (n) => ({ ...n, ...patch }) as Node);
}

export function moveNode(tree: BannerTree, id: string, delta: Vec2): BannerTree {
  return mapNode(tree, id, (n) => ({
    ...n,
    frame: { ...n.frame, x: n.frame.x + delta.x, y: n.frame.y + delta.y },
  }));
}

export function resizeNode(tree: BannerTree, id: string, size: Size): BannerTree {
  return mapNode(tree, id, (n) => ({
    ...n,
    frame: { ...n.frame, w: Math.max(0, size.w), h: Math.max(0, size.h) },
  }));
}

// ---------------------------------------------------------------------------
// Structural ops
// ---------------------------------------------------------------------------

export function insertNode(
  tree: BannerTree,
  parentId: string,
  node: Node,
  index?: number,
): BannerTree {
  return {
    ...tree,
    root: mapNodeIn(tree.root, parentId, (parent) => {
      if (!isContainer(parent)) {
        throw new Error(`insertNode: parent ${parentId} is not a container`);
      }
      const children = [...parent.children];
      const at = index ?? children.length;
      children.splice(at, 0, node);
      return { ...parent, children };
    }) as FrameNode,
  };
}

export function removeNode(tree: BannerTree, id: string): BannerTree {
  if (tree.root.id === id) {
    throw new Error('removeNode: cannot remove root');
  }
  return {
    ...tree,
    root: removeNodeIn(tree.root, id) as FrameNode,
  };
}

function removeNodeIn(node: Node, id: string): Node {
  if (!isContainer(node)) return node;
  return {
    ...node,
    children: node.children
      .filter((c) => c.id !== id)
      .map((c) => removeNodeIn(c, id)),
  };
}

export function reorderChildren(
  tree: BannerTree,
  parentId: string,
  fromIndex: number,
  toIndex: number,
): BannerTree {
  return {
    ...tree,
    root: mapNodeIn(tree.root, parentId, (parent) => {
      if (!isContainer(parent)) return parent;
      const children = [...parent.children];
      const [moved] = children.splice(fromIndex, 1);
      if (!moved) return parent;
      children.splice(toIndex, 0, moved);
      return { ...parent, children };
    }) as FrameNode,
  };
}

export function duplicateNode(tree: BannerTree, id: string): { tree: BannerTree; newId: string | null } {
  const node = findNode(tree, id);
  if (!node) return { tree, newId: null };
  const parent = findParent(tree, id);
  if (!parent) return { tree, newId: null };
  const clone = cloneWithFreshIds(node);
  const index = parent.children.findIndex((c) => c.id === id);
  return {
    tree: insertNode(tree, parent.id, clone, index + 1),
    newId: clone.id,
  };
}

export function cloneWithFreshIds(node: Node): Node {
  const clone: Node = { ...node, id: newNodeId() };
  if (isContainer(clone)) {
    (clone as FrameNode | GroupNode).children = (
      node as FrameNode | GroupNode
    ).children.map(cloneWithFreshIds);
  }
  return clone;
}

// ---------------------------------------------------------------------------
// AI invariant check
// ---------------------------------------------------------------------------

/**
 * Compare two trees; return how many of the original IDs survived in the new
 * one. Used to detect AI edits that wiped node identity. Plan: <70% survival
 * triggers a warning and forces "full rewrite" treatment (history reset).
 */
export function idSurvivalRatio(before: BannerTree, after: BannerTree): number {
  const beforeIds = new Set(listIds(before));
  if (beforeIds.size === 0) return 1;
  const afterIds = new Set(listIds(after));
  let kept = 0;
  for (const id of beforeIds) if (afterIds.has(id)) kept++;
  return kept / beforeIds.size;
}

// ---------------------------------------------------------------------------
// Factory helpers (Phase 1 will use these from the insert palette)
// ---------------------------------------------------------------------------

export function emptyTree(width: number, height: number): BannerTree {
  return {
    schemaVersion: 1,
    canvas: { width, height },
    root: {
      id: newNodeId(),
      type: 'frame',
      name: 'Canvas',
      frame: { x: 0, y: 0, w: width, h: height },
      children: [],
    },
  };
}

export function makeNode(type: NodeType, frame: Vec2 & Size): Node {
  const id = newNodeId();
  switch (type) {
    case 'text':
      return {
        id,
        type: 'text',
        frame,
        text: 'Text',
        color: '#000000',
        align: 'left',
        font: { family: 'Inter', weight: 400, size: 32 },
      };
    case 'image':
      return { id, type: 'image', frame, src: '', fit: 'cover' };
    case 'shape':
      return {
        id,
        type: 'shape',
        frame,
        variant: 'rect',
        fill: { kind: 'solid', color: '#3B82F6' },
      };
    case 'button':
      return {
        id,
        type: 'button',
        frame,
        label: 'Button',
        fill: { kind: 'solid', color: '#111827' },
        textColor: '#FFFFFF',
        cornerRadius: 8,
        font: { family: 'Inter', weight: 600, size: 16 },
        padding: { x: 16, y: 8 },
      };
    case 'frame':
      return { id, type: 'frame', frame, children: [] };
    case 'group':
      return { id, type: 'group', frame, children: [] };
  }
}
