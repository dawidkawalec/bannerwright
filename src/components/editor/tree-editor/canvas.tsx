'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { BannerTree, Node, TextNode } from '@/lib/tree/types';
import { BannerRenderer } from '@/lib/tree/render-react';
import { findNode } from '@/lib/tree/operations';

export type TreeCanvasProps = {
  tree: BannerTree;
  selection: string[];
  hover: string | null;
  onSelect: (id: string | null, additive: boolean) => void;
  onHover: (id: string | null) => void;
  onDragSelected: (delta: { x: number; y: number }) => void;
  onPatchText: (id: string, text: string) => void;
};

type DragState = {
  startClientX: number;
  startClientY: number;
  lastCanvasX: number;
  lastCanvasY: number;
};

export function TreeCanvas({
  tree,
  selection,
  hover,
  onSelect,
  onHover,
  onDragSelected,
  onPatchText,
}: TreeCanvasProps) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(1);
  const scaleRef = useRef(scale);

  useEffect(() => {
    scaleRef.current = scale;
  }, [scale]);

  const dragRef = useRef<DragState | null>(null);
  const pointerSuppressClick = useRef(false);
  const [isDragging, setIsDragging] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { width, height } = tree.canvas;

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    const observer = new ResizeObserver(() => {
      const { clientWidth, clientHeight } = wrapper;
      const padding = 48;
      const sx = (clientWidth - padding) / width;
      const sy = (clientHeight - padding) / height;
      setScale(Math.min(1, sx, sy));
    });
    observer.observe(wrapper);
    return () => observer.disconnect();
  }, [width, height]);

  useEffect(() => {
    if (!isDragging) return;
    const onMove = (e: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag) return;
      const s = scaleRef.current || 1;
      const dx = (e.clientX - drag.startClientX) / s;
      const dy = (e.clientY - drag.startClientY) / s;
      const targetX = Math.round(dx);
      const targetY = Math.round(dy);
      const deltaX = targetX - drag.lastCanvasX;
      const deltaY = targetY - drag.lastCanvasY;
      if (deltaX === 0 && deltaY === 0) return;
      drag.lastCanvasX = targetX;
      drag.lastCanvasY = targetY;
      onDragSelected({ x: deltaX, y: deltaY });
    };
    const onUp = () => {
      dragRef.current = null;
      setIsDragging(false);
      pointerSuppressClick.current = true;
      setTimeout(() => {
        pointerSuppressClick.current = false;
      }, 50);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [isDragging, onDragSelected]);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.button !== 0) return;
      if (editingId) return;
      const target = (e.target as HTMLElement).closest('[data-node-id]');
      const id = target?.getAttribute('data-node-id') ?? null;
      if (!id) return;
      const node = findNode(tree, id);
      if (!node) return;
      if (id === tree.root.id) return;
      if (node.locked) return;
      if (!selection.includes(id)) {
        onSelect(id, e.shiftKey);
      }
      dragRef.current = {
        startClientX: e.clientX,
        startClientY: e.clientY,
        lastCanvasX: 0,
        lastCanvasY: 0,
      };
      setIsDragging(true);
    },
    [editingId, selection, tree, onSelect],
  );

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (pointerSuppressClick.current) return;
      if (editingId) return;
      const target = (e.target as HTMLElement).closest('[data-node-id]');
      const id = target?.getAttribute('data-node-id') ?? null;
      onSelect(id, e.shiftKey);
    },
    [editingId, onSelect],
  );

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const target = (e.target as HTMLElement).closest('[data-node-id]');
      const id = target?.getAttribute('data-node-id') ?? null;
      if (!id) return;
      const node = findNode(tree, id);
      if (node && node.type === 'text') {
        setEditingId(id);
        onSelect(id, false);
      }
    },
    [tree, onSelect],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (isDragging) return;
      const target = (e.target as HTMLElement).closest('[data-node-id]');
      const id = target?.getAttribute('data-node-id') ?? null;
      onHover(id);
    },
    [isDragging, onHover],
  );

  const editingNode =
    editingId && tree
      ? (findNode(tree, editingId) as TextNode | null)
      : null;

  return (
    <div
      ref={wrapperRef}
      className="relative flex h-full w-full items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_center,_#fafafa_0%,_#e5e5e5_100%)]"
      onPointerLeave={() => onHover(null)}
    >
      <div
        className="relative"
        style={{
          width: width * scale,
          height: height * scale,
        }}
      >
        <div
          className="absolute left-0 top-0 origin-top-left shadow-xl ring-1 ring-black/10"
          style={{
            width,
            height,
            transform: `scale(${scale})`,
            cursor: isDragging ? 'grabbing' : 'default',
          }}
          onClick={handleClick}
          onDoubleClick={handleDoubleClick}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
        >
          <BannerRenderer tree={tree} />
        </div>
        <Overlays
          tree={tree}
          selection={selection}
          hover={hover}
          editingId={editingId}
          scale={scale}
        />
        {editingNode && (
          <InlineTextEditor
            key={editingNode.id}
            node={editingNode}
            scale={scale}
            absolutePosition={getAbsoluteFrame(tree, editingNode.id)}
            onCommit={(text) => {
              onPatchText(editingNode.id, text);
              setEditingId(null);
            }}
            onCancel={() => setEditingId(null)}
          />
        )}
      </div>
    </div>
  );
}

function InlineTextEditor({
  node,
  scale,
  absolutePosition,
  onCommit,
  onCancel,
}: {
  node: TextNode;
  scale: number;
  absolutePosition: { x: number; y: number } | null;
  onCommit: (text: string) => void;
  onCancel: () => void;
}) {
  const ref = useRef<HTMLTextAreaElement | null>(null);
  const [value, setValue] = useState(node.text);

  useEffect(() => {
    const ta = ref.current;
    if (!ta) return;
    ta.focus();
    ta.select();
  }, []);

  if (!absolutePosition) return null;

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={() => onCommit(value)}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          onCancel();
        }
        // Enter without shift commits; shift+enter inserts a newline.
        if (e.key === 'Enter' && !e.shiftKey && !e.metaKey && !e.ctrlKey) {
          e.preventDefault();
          onCommit(value);
        }
      }}
      style={{
        position: 'absolute',
        left: absolutePosition.x * scale,
        top: absolutePosition.y * scale,
        width: node.frame.w * scale,
        height: node.frame.h * scale,
        color: node.color,
        background: 'rgba(255,255,255,0.92)',
        outline: '2px solid #38BDF8',
        fontFamily: `"${node.font.family}", sans-serif`,
        fontWeight: node.font.weight,
        fontSize: node.font.size * scale,
        lineHeight: node.font.lineHeight ?? 1.1,
        letterSpacing: node.font.letterSpacing ?? 0,
        textAlign: node.align,
        padding: 0,
        margin: 0,
        border: 'none',
        resize: 'none',
        overflow: 'hidden',
        whiteSpace: 'pre-wrap',
        boxSizing: 'border-box',
      }}
    />
  );
}

function Overlays({
  tree,
  selection,
  hover,
  editingId,
  scale,
}: {
  tree: BannerTree;
  selection: string[];
  hover: string | null;
  editingId: string | null;
  scale: number;
}) {
  const lookup = useFrameLookup(tree, scale);
  return (
    <div className="pointer-events-none absolute inset-0">
      {hover && !selection.includes(hover) && lookup[hover] && (
        <div
          className="absolute rounded-[1px] ring-1 ring-sky-400/60"
          style={lookup[hover]}
        />
      )}
      {selection.map((id) =>
        lookup[id] && id !== editingId ? (
          <div
            key={id}
            className="absolute rounded-[1px] ring-2 ring-sky-500"
            style={lookup[id]}
          />
        ) : null,
      )}
    </div>
  );
}

type FrameBox = { left: number; top: number; width: number; height: number };

function useFrameLookup(tree: BannerTree, scale: number): Record<string, FrameBox> {
  const lookup: Record<string, FrameBox> = {};
  walk(tree.root, 0, 0, lookup, scale);
  return lookup;
}

function walk(
  node: Node,
  ox: number,
  oy: number,
  out: Record<string, FrameBox>,
  scale: number,
): void {
  const absX = ox + node.frame.x;
  const absY = oy + node.frame.y;
  out[node.id] = {
    left: absX * scale,
    top: absY * scale,
    width: node.frame.w * scale,
    height: node.frame.h * scale,
  };
  if (node.type === 'frame' || node.type === 'group') {
    for (const c of node.children) walk(c, absX, absY, out, scale);
  }
}

function getAbsoluteFrame(tree: BannerTree, id: string): { x: number; y: number } | null {
  return findAbs(tree.root, 0, 0, id);
}

function findAbs(
  node: Node,
  ox: number,
  oy: number,
  id: string,
): { x: number; y: number } | null {
  const absX = ox + node.frame.x;
  const absY = oy + node.frame.y;
  if (node.id === id) return { x: absX, y: absY };
  if (node.type === 'frame' || node.type === 'group') {
    for (const c of node.children) {
      const found = findAbs(c, absX, absY, id);
      if (found) return found;
    }
  }
  return null;
}
