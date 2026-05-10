'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { dimensionsFor } from '@/lib/renderer/formats';
import type { GenerationFormat } from '@/lib/db/schema';
import { cn } from '@/lib/utils';

type Props = {
  html: string;
  format: GenerationFormat;
  className?: string;
  /** When set, renders an overlay with a spinner over the preview. */
  busy?: boolean;
  busyLabel?: string;
};

/**
 * Sandboxed iframe preview that scales the banner down to fit the container
 * while preserving the exact pixel dimensions internally. `sandbox` flag
 * deliberately omits `allow-scripts` — generated HTML never executes.
 */
export function BannerPreview({ html, format, className, busy, busyLabel }: Props) {
  const { width, height } = useMemo(() => dimensionsFor(format), [format]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width === 0) return;
      setScale(Math.min(1, rect.width / width));
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [width]);

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative w-full overflow-hidden rounded-lg border border-border bg-muted/30 transition-shadow',
        busy && 'shadow-[0_0_0_2px_var(--color-primary)] animate-[bw-pulse_1.6s_ease-in-out_infinite]',
        className,
      )}
      style={{ aspectRatio: `${width} / ${height}` }}
    >
      <iframe
        title="Banner preview"
        sandbox="allow-same-origin"
        className="absolute left-0 top-0 origin-top-left border-0"
        style={{
          width,
          height,
          transform: `scale(${scale})`,
        }}
        srcDoc={html || '<html><body></body></html>'}
      />
      {busy && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-background/55 backdrop-blur-[2px]">
          <div className="flex items-center gap-2 rounded-full border border-primary/30 bg-card/90 px-4 py-2 shadow-lg ring-1 ring-primary/40">
            <Loader2 className="size-4 animate-spin text-primary" />
            <span className="text-xs font-medium text-foreground">{busyLabel ?? 'AI is working…'}</span>
          </div>
        </div>
      )}
    </div>
  );
}
