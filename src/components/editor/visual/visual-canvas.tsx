'use client';

import DOMPurify from 'isomorphic-dompurify';
import { useEffect, useMemo, useRef, useState } from 'react';
import { dimensionsFor } from '@/lib/renderer/formats';
import type { GenerationFormat } from '@/lib/db/schema';
import { nearestStampedAncestor } from '@/lib/wysiwyg/stamp';

const SELECTION_STYLE_ID = 'bw-selection-style';
const SELECTION_RULE = `
[data-bw-id]:hover {
  outline: 2px dashed rgba(99, 102, 241, 0.55);
  outline-offset: 1px;
  cursor: pointer;
}
[data-bw-id][data-bw-selected="true"] {
  outline: 3px solid #6366F1 !important;
  outline-offset: 1px !important;
}
`;

// Same defence-in-depth config we use in lib/renderer/render-png.ts. Even
// though banner HTML originates from our own pipeline, Shadow DOM happily
// executes <script> if injected — sanitise before insertion.
const SANITIZE_CONFIG = {
  WHOLE_DOCUMENT: true,
  ADD_TAGS: ['style', 'link'],
  ADD_ATTR: ['rel', 'href', 'as', 'crossorigin', 'media', 'data-bw-id', 'data-bw-selected'],
  FORBID_TAGS: ['script', 'noscript', 'iframe', 'object', 'embed'],
  FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'],
};

type Props = {
  html: string;
  format: GenerationFormat;
  selectedId: string | null;
  onSelect: (bwId: string | null) => void;
  /** Bumped by the parent when it wants the canvas to re-render (e.g. after applyOps). */
  refreshKey?: number;
  onShadowReady?: (shadow: ShadowRoot) => void;
  className?: string;
  /** When true, renders an "AI working" overlay on top of the canvas. */
  busy?: boolean;
  busyLabel?: string;
};

export function VisualCanvas({
  html,
  format,
  selectedId,
  onSelect,
  refreshKey = 0,
  onShadowReady,
  className,
  busy,
  busyLabel,
}: Props) {
  const { width, height } = useMemo(() => dimensionsFor(format), [format]);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  // Render banner HTML into the shadow root.
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const shadow = host.shadowRoot ?? host.attachShadow({ mode: 'open' });

    if (!shadow.getElementById(SELECTION_STYLE_ID)) {
      const styleEl = document.createElement('style');
      styleEl.id = SELECTION_STYLE_ID;
      styleEl.textContent = SELECTION_RULE;
      shadow.appendChild(styleEl);
    }

    const container = ensureContainer(shadow);
    const safe = DOMPurify.sanitize(html, SANITIZE_CONFIG);
    container.innerHTML = safe;
    onShadowReady?.(shadow);
    applySelectionMarker(shadow, selectedId);
  }, [html, refreshKey, onShadowReady, selectedId]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host?.shadowRoot) return;
    applySelectionMarker(host.shadowRoot, selectedId);
  }, [selectedId]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host?.shadowRoot) return;
    const shadow = host.shadowRoot;

    const onClick = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      const target = nearestStampedAncestor(e.target);
      onSelect(target ? target.dataset.bwId ?? null : null);
    };

    shadow.addEventListener('click', onClick);
    return () => shadow.removeEventListener('click', onClick);
  }, [onSelect]);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    const update = () => {
      const rect = wrapper.getBoundingClientRect();
      if (rect.width === 0) return;
      setScale(Math.min(1, rect.width / width));
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(wrapper);
    return () => observer.disconnect();
  }, [width]);

  return (
    <div
      ref={wrapperRef}
      className={`relative w-full overflow-hidden rounded-lg border border-border bg-card shadow-sm transition-shadow ${
        busy ? 'animate-[bw-pulse_1.6s_ease-in-out_infinite]' : ''
      } ${className ?? ''}`}
      style={{ aspectRatio: `${width} / ${height}` }}
      onClick={(e) => {
        if (e.target === wrapperRef.current) onSelect(null);
      }}
    >
      <div
        ref={hostRef}
        style={{
          width,
          height,
          transformOrigin: 'top left',
          transform: `scale(${scale})`,
        }}
      />
      {busy && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-background/55 backdrop-blur-[2px]">
          <div className="flex items-center gap-2 rounded-full border border-primary/30 bg-card/90 px-4 py-2 shadow-lg ring-1 ring-primary/40">
            <span className="size-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <span className="text-xs font-medium text-foreground">{busyLabel ?? 'AI is working…'}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function ensureContainer(shadow: ShadowRoot): HTMLDivElement {
  let container = shadow.getElementById('bw-canvas') as HTMLDivElement | null;
  if (!container) {
    container = document.createElement('div');
    container.id = 'bw-canvas';
    shadow.appendChild(container);
  }
  return container;
}

function applySelectionMarker(shadow: ShadowRoot, bwId: string | null) {
  shadow.querySelectorAll('[data-bw-selected]').forEach((el) => {
    (el as HTMLElement).removeAttribute('data-bw-selected');
  });
  if (!bwId) return;
  const target = shadow.querySelector(`[data-bw-id="${cssEscape(bwId)}"]`);
  if (target) (target as HTMLElement).setAttribute('data-bw-selected', 'true');
}

function cssEscape(s: string): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const css = (globalThis as any).CSS;
  if (css && typeof css.escape === 'function') return css.escape(s);
  return s.replace(/[^\w-]/g, (c) => `\\${c}`);
}
