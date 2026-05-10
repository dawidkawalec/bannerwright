'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { dimensionsFor } from '@/lib/renderer/formats';
import type { GenerationFormat } from '@/lib/db/schema';
import { cn } from '@/lib/utils';

type Props = {
  html: string;
  format: GenerationFormat;
  className?: string;
};

/**
 * Sandboxed iframe preview that scales the banner down to fit the container
 * while preserving the exact pixel dimensions internally. `sandbox` flag
 * deliberately omits `allow-scripts` — generated HTML never executes.
 */
export function BannerPreview({ html, format, className }: Props) {
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

  // Use srcDoc so cross-origin worries disappear and the parent can hand HTML
  // straight in. Browsers re-parse on srcDoc change which keeps preview live.
  return (
    <div
      ref={containerRef}
      className={cn(
        'relative w-full overflow-hidden rounded-lg border border-border bg-muted/30',
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
    </div>
  );
}
