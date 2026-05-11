'use client';

import { create } from 'zustand';
import { temporal } from 'zundo';
import { produce } from 'immer';
import type { BannerTree, FrameNode, Node, Vec2 } from './types';
import {
  duplicateNode as duplicateNodeOp,
  findNode,
  findParent,
  insertNode,
  removeNode,
  setNodePatch as setNodePatchOp,
} from './operations';

export type EditorState = {
  tree: BannerTree;
  selection: string[];
  hover: string | null;
  dirty: boolean;

  setTree: (tree: BannerTree) => void;
  setSelection: (ids: string[]) => void;
  setHover: (id: string | null) => void;
  markClean: () => void;

  patchNode: <T extends Partial<Node>>(id: string, patch: T) => void;
  moveSelectedBy: (delta: Vec2) => void;
  insertChild: (parentId: string, node: Node, index?: number) => void;
  removeSelected: () => void;
  duplicateSelected: () => void;
};

const SELECT_LIMIT = 20;

export function createEditorStore(initial: BannerTree) {
  return create<EditorState>()(
    temporal(
      (set) => ({
        tree: initial,
        selection: [],
        hover: null,
        dirty: false,

        setTree: (tree) => set({ tree, dirty: true }),
        setSelection: (ids) => set({ selection: ids.slice(0, SELECT_LIMIT) }),
        setHover: (id) => set({ hover: id }),
        markClean: () => set({ dirty: false }),

        patchNode: (id, patch) =>
          set(
            produce((s: EditorState) => {
              s.tree = setNodePatchOp(s.tree, id, patch);
              s.dirty = true;
            }),
          ),

        moveSelectedBy: (delta) =>
          set(
            produce((s: EditorState) => {
              if (s.selection.length === 0) return;
              let tree = s.tree;
              for (const id of s.selection) {
                const node = findNode(tree, id);
                if (!node || node.locked) continue;
                tree = setNodePatchOp(tree, id, {
                  frame: {
                    ...node.frame,
                    x: node.frame.x + delta.x,
                    y: node.frame.y + delta.y,
                  },
                });
              }
              s.tree = tree;
              s.dirty = true;
            }),
          ),

        insertChild: (parentId, node, index) =>
          set(
            produce((s: EditorState) => {
              s.tree = insertNode(s.tree, parentId, node, index);
              s.selection = [node.id];
              s.dirty = true;
            }),
          ),

        removeSelected: () =>
          set(
            produce((s: EditorState) => {
              for (const id of s.selection) {
                if (id === s.tree.root.id) continue;
                s.tree = removeNode(s.tree, id);
              }
              s.selection = [];
              s.dirty = true;
            }),
          ),

        duplicateSelected: () =>
          set(
            produce((s: EditorState) => {
              const newIds: string[] = [];
              for (const id of s.selection) {
                const { tree, newId } = duplicateNodeOp(s.tree, id);
                s.tree = tree;
                if (newId) newIds.push(newId);
              }
              if (newIds.length > 0) s.selection = newIds;
              s.dirty = true;
            }),
          ),
      }),
      {
        // Only the tree participates in undo/redo — selection/hover/dirty are
        // ephemeral UI state.
        partialize: (state) => ({ tree: state.tree }) as Pick<EditorState, 'tree'>,
        limit: 50,
      },
    ),
  );
}

export type EditorStore = ReturnType<typeof createEditorStore>;

// Re-export helpers for consumers.
export { findNode, findParent };
export type { FrameNode };
