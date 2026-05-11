'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { BannerTree, Node } from '@/lib/tree/types';
import { BannerRenderer } from '@/lib/tree/render-react';
import { findNode } from '@/lib/tree/operations';

export type TreeCanvasProps = {
  tree: BannerTree;
  selection: string[];
  hover: string | null;
  onSelect: (id: string | null, additive: boolean) => void;
  onHover: (id: string | null) => void;
  /** Called while dragging selected nodes. delta is in canvas pixels. */
  onDragSelected: (delta: { x: number; y: number }) => void;
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
}: TreeCanvasProps) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(1);
  const scaleRef = useRef(scale);

  // Keep `scaleRef` in sync without writing to it during render.
  useEffect(() => {
    scaleRef.current = scale;
  }, [scale]);

  const dragRef = useRef<DragState | null>(null);
  const pointerSuppressClick = useRef(false);
  const [isDragging, setIsDragging] = useState(false);

  const { width, height } = tree.canvas;

  // Fit-to-container scaling.
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

  // Global move/up listeners while dragging. Window-bound so we don't lose the
  // drag if the cursor leaves the stage during fast movement.
  useEffect(() => {
    if (!isDragging) return;
    const onMove = (e: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag) return;
      const s = scaleRef.current || 1;
      const dx = (e.clientX - drag.startClientX) / s;
      const dy = (e.clientY - drag.startClientY) / s;
      // Round to integer pixels for stable inspector values.
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
      // Suppress the synthetic click that fires after pointerup if we
      // actually dragged the element.
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
      const target = (e.target as HTMLElement).closest('[data-node-id]');
      const id = target?.getAttribute('data-node-id') ?? null;
      if (!id) return;
      const node = findNode(tree, id);
      if (!node) return;
      // Root frame is the canvas itself — don't drag it.
      if (id === tree.root.id) return;
      if (node.locked) return;
      // Ensure the clicked element is selected before starting drag.
      if (!selection.includes(id)) {
        onSelect(id, e.shiftKey);
      }
      dragRef.current = {
        startClientX: e.clientX,
        startClientY: e.clientY,
        lastCanvasX: 0,
        lastCanvasY: 0,
      };
      // We don't flip isDragging until we cross threshold (in pointermove
      // below), but we DO need a global listener attached now.
      setIsDragging(true);
    },
    [selection, tree, onSelect],
  );

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (pointerSuppressClick.current) return;
      const target = (e.target as HTMLElement).closest('[data-node-id]');
      const id = target?.getAttribute('data-node-id') ?? null;
      onSelect(id, e.shiftKey);
    },
    [onSelect],
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
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
        >
          <BannerRenderer tree={tree} />
        </div>
        <Overlays
          tree={tree}
          selection={selection}
          hover={hover}
          scale={scale}
        />
      </div>
    </div>
  );
}

function Overlays({
  tree,
  selection,
  hover,
  scale,
}: {
  tree: BannerTree;
  selection: string[];
  hover: string | null;
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
        lookup[id] ? (
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

