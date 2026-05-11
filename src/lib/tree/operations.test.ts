import { describe, expect, it } from 'vitest';
import type { BannerTree } from './types';
import {
  duplicateNode,
  emptyTree,
  findNode,
  findParent,
  idSurvivalRatio,
  insertNode,
  listIds,
  makeNode,
  mapNode,
  moveNode,
  removeNode,
  reorderChildren,
  resizeNode,
  setNodePatch,
} from './operations';

function fixture(): BannerTree {
  const tree = emptyTree(1080, 1080);
  const text = makeNode('text', { x: 100, y: 100, w: 500, h: 100 });
  const button = makeNode('button', { x: 100, y: 300, w: 200, h: 60 });
  return insertNode(insertNode(tree, tree.root.id, text), tree.root.id, button);
}

describe('tree/operations', () => {
  it('emptyTree builds canvas-sized root frame', () => {
    const tree = emptyTree(1200, 628);
    expect(tree.canvas).toEqual({ width: 1200, height: 628 });
    expect(tree.root.type).toBe('frame');
    expect(tree.root.frame).toEqual({ x: 0, y: 0, w: 1200, h: 628 });
    expect(tree.root.children).toEqual([]);
  });

  it('findNode locates by id; findParent returns null for root', () => {
    const tree = fixture();
    const childId = tree.root.children[0]!.id;
    expect(findNode(tree, childId)?.id).toBe(childId);
    expect(findNode(tree, 'nonexistent')).toBeNull();
    expect(findParent(tree, tree.root.id)).toBeNull();
    expect(findParent(tree, childId)?.id).toBe(tree.root.id);
  });

  it('mapNode produces a new tree without mutating original', () => {
    const tree = fixture();
    const childId = tree.root.children[0]!.id;
    const next = mapNode(tree, childId, (n) =>
      n.type === 'text' ? { ...n, text: 'changed' } : n,
    );
    expect(next).not.toBe(tree);
    expect(next.root).not.toBe(tree.root);
    const original = findNode(tree, childId);
    expect(original?.type === 'text' && original.text).toBe('Text');
    const patched = findNode(next, childId);
    expect(patched?.type === 'text' && patched.text).toBe('changed');
  });

  it('setNodePatch updates fields', () => {
    const tree = fixture();
    const childId = tree.root.children[0]!.id;
    const next = setNodePatch(tree, childId, { name: 'Headline' });
    expect(findNode(next, childId)?.name).toBe('Headline');
  });

  it('moveNode shifts frame by delta', () => {
    const tree = fixture();
    const childId = tree.root.children[0]!.id;
    const next = moveNode(tree, childId, { x: 10, y: -5 });
    const node = findNode(next, childId)!;
    expect(node.frame.x).toBe(110);
    expect(node.frame.y).toBe(95);
  });

  it('resizeNode clamps to >= 0', () => {
    const tree = fixture();
    const childId = tree.root.children[0]!.id;
    const next = resizeNode(tree, childId, { w: -50, h: 200 });
    expect(findNode(next, childId)!.frame.w).toBe(0);
    expect(findNode(next, childId)!.frame.h).toBe(200);
  });

  it('removeNode removes a child but cannot remove root', () => {
    const tree = fixture();
    const childId = tree.root.children[0]!.id;
    const next = removeNode(tree, childId);
    expect(findNode(next, childId)).toBeNull();
    expect(next.root.children).toHaveLength(1);
    expect(() => removeNode(tree, tree.root.id)).toThrow();
  });

  it('reorderChildren swaps order', () => {
    const tree = fixture();
    const ids = tree.root.children.map((c) => c.id);
    const next = reorderChildren(tree, tree.root.id, 0, 1);
    const newIds = next.root.children.map((c) => c.id);
    expect(newIds).toEqual([ids[1], ids[0]]);
  });

  it('duplicateNode clones with fresh ids and inserts after original', () => {
    const tree = fixture();
    const childId = tree.root.children[0]!.id;
    const { tree: next, newId } = duplicateNode(tree, childId);
    expect(newId).toBeTruthy();
    expect(newId).not.toBe(childId);
    expect(next.root.children).toHaveLength(3);
    expect(next.root.children[1]!.id).toBe(newId);
  });

  it('listIds walks every node depth-first', () => {
    const tree = fixture();
    const ids = listIds(tree);
    expect(ids).toContain(tree.root.id);
    expect(ids).toHaveLength(3);
  });

  it('idSurvivalRatio measures preserved ids between versions', () => {
    const before = fixture();
    const childId = before.root.children[0]!.id;
    const sameMutation = setNodePatch(before, childId, { name: 'x' });
    expect(idSurvivalRatio(before, sameMutation)).toBe(1);

    const newBranch = removeNode(before, childId);
    expect(idSurvivalRatio(before, newBranch)).toBeCloseTo(2 / 3, 5);
  });
});
