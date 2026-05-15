'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Globe, Palette, MessageSquare, Code2, ImageIcon, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type Node = {
  id: string;
  label: string;
  icon: LucideIcon;
  preview: 'url' | 'brand' | 'brief' | 'html' | 'png';
};

const NODES: Node[] = [
  { id: 'url', label: 'URL', icon: Globe, preview: 'url' },
  { id: 'brand', label: 'Brand', icon: Palette, preview: 'brand' },
  { id: 'brief', label: 'Brief', icon: MessageSquare, preview: 'brief' },
  { id: 'html', label: 'HTML', icon: Code2, preview: 'html' },
  { id: 'png', label: 'PNG', icon: ImageIcon, preview: 'png' },
];

const PNG_ROTATION = [
  '/landing/banners/01-maple-holiday-drop.png',
  '/landing/banners/04-olivetto-summer-menu.png',
  '/landing/banners/07-brushwork-academy-cohort.png',
  '/landing/banners/02-makers-hour-podcast.png',
];

const STEP_MS = 1500;

export function HeroCPipeline() {
  const reduceMotion = useReducedMotion();
  const [active, setActive] = useState(0);
  const [pngIndex, setPngIndex] = useState(0);

  useEffect(() => {
    if (reduceMotion) return;
    const id = setInterval(() => {
      setActive((i) => {
        const next = (i + 1) % NODES.length;
        if (next === 0) setPngIndex((p) => (p + 1) % PNG_ROTATION.length);
        return next;
      });
    }, STEP_MS);
    return () => clearInterval(id);
  }, [reduceMotion]);

  return (
    <div className="relative">
      <div className="absolute -inset-6 -z-10 rounded-3xl bg-gradient-to-br from-primary/15 via-transparent to-transparent blur-2xl" />

      {/* Connection lines (between adjacent nodes, runs full height) */}
      <ConnectionLines activeIndex={active} reduceMotion={reduceMotion ?? false} />

      <ul className="relative grid gap-3">
        {NODES.map((node, i) => (
          <PipelineNode
            key={node.id}
            node={node}
            index={i}
            active={i === active}
            past={i < active}
            pngSrc={PNG_ROTATION[pngIndex]}
            reduceMotion={reduceMotion ?? false}
          />
        ))}
      </ul>
    </div>
  );
}

function ConnectionLines({
  activeIndex,
  reduceMotion,
}: {
  activeIndex: number;
  reduceMotion: boolean;
}) {
  // Vertical line glow positioned absolutely behind the node list.
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute left-[1.45rem] top-6 bottom-6 z-0 w-px"
    >
      <div className="absolute inset-0 bg-white/10" />
      {!reduceMotion && (
        <motion.div
          className="absolute left-0 right-0 h-12 -translate-y-1/2 bg-gradient-to-b from-transparent via-primary to-transparent"
          animate={{ top: `${(activeIndex / Math.max(1, NODES.length - 1)) * 100}%` }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        />
      )}
    </div>
  );
}

function PipelineNode({
  node,
  index,
  active,
  past,
  pngSrc,
  reduceMotion,
}: {
  node: Node;
  index: number;
  active: boolean;
  past: boolean;
  pngSrc: string;
  reduceMotion: boolean;
}) {
  const Icon = node.icon;

  return (
    <motion.li
      initial={reduceMotion ? false : { opacity: 0, x: 16 }}
      animate={reduceMotion ? undefined : { opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
      className="relative z-10 flex gap-4"
    >
      {/* Node marker */}
      <div className="flex-shrink-0 pt-1">
        <div
          className={cn(
            'relative flex size-12 items-center justify-center rounded-full border transition-all',
            active
              ? 'border-primary/50 bg-primary/15 text-primary'
              : past
                ? 'border-primary/30 bg-primary/8 text-primary/70'
                : 'border-white/10 bg-[oklch(0.18_0.005_250)] text-muted-foreground',
          )}
        >
          {active && !reduceMotion && (
            <span className="absolute inset-0 animate-ping rounded-full bg-primary/30" />
          )}
          <Icon className="relative size-5" />
        </div>
      </div>

      {/* Node card */}
      <div
        className={cn(
          'flex-1 overflow-hidden rounded-xl border transition-colors',
          active
            ? 'border-primary/30 bg-[oklch(0.2_0.008_250)] shadow-lg shadow-primary/10'
            : 'border-white/8 bg-[oklch(0.17_0.005_250)]',
        )}
      >
        <div className="flex items-center justify-between border-b border-white/5 px-3 py-1.5 text-[10px] uppercase tracking-[0.18em]">
          <span className={active ? 'text-primary' : 'text-muted-foreground'}>{node.label}</span>
          <span className="font-mono text-muted-foreground/70">
            step {index + 1}/{NODES.length}
          </span>
        </div>
        <div className="p-3">
          <NodePreview kind={node.preview} pngSrc={pngSrc} />
        </div>
      </div>
    </motion.li>
  );
}

function NodePreview({ kind, pngSrc }: { kind: Node['preview']; pngSrc: string }) {
  switch (kind) {
    case 'url':
      return (
        <div className="flex items-center gap-2 rounded-md border border-white/10 bg-black/40 px-2.5 py-1.5 font-mono text-[11px] text-muted-foreground">
          <span className="flex gap-1">
            <span className="size-1.5 rounded-full bg-white/20" />
            <span className="size-1.5 rounded-full bg-white/20" />
            <span className="size-1.5 rounded-full bg-white/20" />
          </span>
          <span className="text-primary/70">https://</span>
          <span className="text-foreground">acme.com</span>
        </div>
      );

    case 'brand':
      return (
        <div className="space-y-2">
          <div className="flex gap-1.5">
            {['#0E3B43', '#D9603B', '#F4E3C3', '#1B1B1B'].map((c) => (
              <span
                key={c}
                className="size-5 rounded-md ring-1 ring-white/10"
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
          <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
            <span className="font-serif text-foreground">Aa</span>
            <span>Editorial Serif · Sans Display</span>
          </div>
        </div>
      );

    case 'brief':
      return (
        <pre className="whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-muted-foreground">
{`> Holiday sale · IG square
  CTA: "Shop the drop"
  Voice: warm, confident`}
        </pre>
      );

    case 'html':
      return (
        <pre className="overflow-hidden font-mono text-[10px] leading-relaxed">
          <code>
            <span className="text-muted-foreground">&lt;section</span>{' '}
            <span className="text-primary">class</span>=
            <span className="text-foreground">&quot;banner&quot;</span>
            <span className="text-muted-foreground">&gt;</span>
            {'\n  '}
            <span className="text-muted-foreground">&lt;h2&gt;</span>Holiday drop.
            <span className="text-muted-foreground">&lt;/h2&gt;</span>
            {'\n  '}
            <span className="text-muted-foreground">&lt;p&gt;</span>48 hours.
            <span className="text-muted-foreground">&lt;/p&gt;</span>
            {'\n'}
            <span className="text-muted-foreground">&lt;/section&gt;</span>
          </code>
        </pre>
      );

    case 'png':
      return (
        <div className="relative aspect-square w-full overflow-hidden rounded-md ring-1 ring-white/10">
          <Image
            src={pngSrc}
            alt="Rendered banner sample"
            fill
            sizes="(min-width: 768px) 240px, 180px"
            className="object-cover"
          />
        </div>
      );
  }
}
