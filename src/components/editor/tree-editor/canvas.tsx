'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { BannerTree } from '@/lib/tree/types';
import { BannerRenderer } from '@/lib/tree/render-react';

export type TreeCanvasProps = {
  tree: BannerTree;
  selection: string[];
  hover: string | null;
  onSelect: (id: string | null, additive: boolean) => void;
  onHover: (id: string | null) => void;
};

export function TreeCanvas({
  tree,
  selection,
  hover,
  onSelect,
  onHover,
}: TreeCanvasProps) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(1);

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

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const target = (e.target as HTMLElement).closest('[data-node-id]');
      const id = target?.getAttribute('data-node-id') ?? null;
      onSelect(id, e.shiftKey);
    },
    [onSelect],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const target = (e.target as HTMLElement).closest('[data-node-id]');
      const id = target?.getAttribute('data-node-id') ?? null;
      onHover(id);
    },
    [onHover],
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
          ref={stageRef}
          className="absolute left-0 top-0 origin-top-left shadow-xl ring-1 ring-black/10"
          style={{
            width,
            height,
            transform: `scale(${scale})`,
          }}
          onClick={handleClick}
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
  // Compute absolute (canvas-space) positions for every node, then scale.
  // Banners are small (<100 nodes) so recompute on every render is fine.
  const lookup: Record<string, FrameBox> = {};
  walk(tree.root, 0, 0, lookup, scale);
  return lookup;
}

function walk(
  node: { id: string; frame: { x: number; y: number; w: number; h: number }; type: string } & {
    children?: Array<{ id: string; frame: { x: number; y: number; w: number; h: number }; type: string }>;
  },
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
  const children = (node as { children?: Array<{ id: string; frame: { x: number; y: number; w: number; h: number }; type: string }> })
    .children;
  if (Array.isArray(children)) {
    for (const c of children) walk(c, absX, absY, out, scale);
  }
}
