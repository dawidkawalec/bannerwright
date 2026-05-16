'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

type Slot = {
  brief: string;
  format: string;
  banner: string;
  alt: string;
};

const REEL: Slot[] = [
  {
    brief: '> Holiday sale for maple-and-co.com\n  - 1080×1080 · Instagram feed\n  - CTA: "Shop the drop"\n  - Voice: warm, confident',
    format: '1080×1080 · Instagram',
    banner: '/landing/banners/01-maple-holiday-drop.png',
    alt: 'Holiday sale banner for Maple & Co.',
  },
  {
    brief: '> Podcast episode promo\n  - 1080×1080 · square card\n  - Title: "Building in the open"\n  - Voice: thoughtful, editorial',
    format: '1080×1080 · Podcast cover',
    banner: '/landing/banners/02-makers-hour-podcast.png',
    alt: 'Podcast episode banner for The Maker’s Hour',
  },
  {
    brief: '> SaaS launch announcement\n  - 1200×628 · LinkedIn / X card\n  - CTA: "Try it free"\n  - Voice: precise, technical',
    format: '1200×628 · Social card',
    banner: '/landing/banners/05-northsignal-ai-extraction.png',
    alt: 'SaaS launch banner for Northsignal',
  },
  {
    brief: '> Trattoria summer menu\n  - 1080×1080 · Instagram\n  - CTA: "Reserve a table"\n  - Voice: warm, Italian editorial',
    format: '1080×1080 · Instagram',
    banner: '/landing/banners/04-olivetto-summer-menu.png',
    alt: 'Summer menu banner for Olivetto',
  },
  {
    brief: '> Coffee shop opening\n  - 1080×1080 · Instagram\n  - Address line + hours\n  - Voice: friendly, slow craft',
    format: '1080×1080 · Instagram',
    banner: '/landing/banners/06-foundry-coffee-opening.png',
    alt: 'Grand opening banner for Foundry Coffee',
  },
  {
    brief: '> Online course cohort\n  - 1080×1080 · Instagram\n  - CTA: "Save your seat"\n  - Voice: confident, energetic',
    format: '1080×1080 · Instagram',
    banner: '/landing/banners/07-brushwork-academy-cohort.png',
    alt: 'Cohort 04 launch banner for Brushwork Academy',
  },
];

const TYPING_SPEED = 8;
const HOLD_MS = 2200;

type Phase = 'typing' | 'generating' | 'done';

export function HeroAReel() {
  const [index, setIndex] = useState(0);

  return (
    <div className="relative">
      <div className="absolute -inset-4 -z-10 rounded-3xl bg-gradient-to-br from-primary/25 via-transparent to-transparent blur-2xl" />

      <SlotPlayer
        key={index}
        slot={REEL[index]}
        index={index}
        total={REEL.length}
        onComplete={() => setIndex((i) => (i + 1) % REEL.length)}
      />

      <div className="mt-3 flex justify-center gap-1.5">
        {REEL.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setIndex(i)}
            aria-label={`Show banner ${i + 1}`}
            className={
              i === index
                ? 'h-1 w-6 rounded-full bg-primary transition-all'
                : 'h-1 w-1.5 rounded-full bg-white/15 transition-all hover:bg-white/30'
            }
          />
        ))}
      </div>
    </div>
  );
}

function SlotPlayer({
  slot,
  index,
  total,
  onComplete,
}: {
  slot: Slot;
  index: number;
  total: number;
  onComplete: () => void;
}) {
  const reduceMotion = useReducedMotion();
  const [typedBrief, setTypedBrief] = useState(reduceMotion ? slot.brief : '');
  const [phase, setPhase] = useState<Phase>(reduceMotion ? 'done' : 'typing');

  // Typing effect — runs once per mount (parent passes key={index}).
  useEffect(() => {
    if (reduceMotion) return;
    let i = 0;
    const id = setInterval(() => {
      i += 3;
      setTypedBrief(slot.brief.slice(0, i));
      if (i >= slot.brief.length) {
        clearInterval(id);
        setTimeout(() => setPhase('generating'), 60);
        setTimeout(() => setPhase('done'), 420);
      }
    }, TYPING_SPEED);
    return () => clearInterval(id);
  }, [slot.brief, reduceMotion]);

  // Advance after 'done' has held long enough.
  useEffect(() => {
    if (reduceMotion || phase !== 'done') return;
    const id = setTimeout(onComplete, HOLD_MS);
    return () => clearTimeout(id);
  }, [phase, reduceMotion, onComplete]);

  return (
    <div className="grid gap-3">
      <Card label={`brief.md · slot ${index + 1}/${total}`}>
        <pre className="min-h-[5.5rem] whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-muted-foreground">
          {typedBrief}
          {!reduceMotion && phase === 'typing' && (
            <span className="ml-0.5 inline-block h-3 w-1.5 -translate-y-px animate-pulse bg-primary" />
          )}
        </pre>
      </Card>

      <div className="flex items-center justify-between rounded-xl border border-white/10 bg-[oklch(0.18_0.005_250)] px-3 py-2 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-2">
          <StatusDot phase={phase} />
          <span>
            {phase === 'typing' && 'Reading brief…'}
            {phase === 'generating' && 'Generating HTML…'}
            {phase === 'done' && 'Rendered ✓'}
          </span>
        </span>
        <span className="font-mono">{slot.format}</span>
      </div>

      <div className="overflow-hidden rounded-xl border border-white/10 shadow-2xl shadow-black/40">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0.35, scale: 0.97 }}
          animate={
            reduceMotion ? undefined : { opacity: phase === 'done' ? 1 : 0.45, scale: 1 }
          }
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="relative aspect-square w-full"
        >
          <Image
            src={slot.banner}
            alt={slot.alt}
            fill
            sizes="(min-width: 768px) 32vw, 100vw"
            className="object-cover"
            priority={index === 0}
          />
          {!reduceMotion && phase === 'generating' && (
            <div className="pointer-events-none absolute inset-0 animate-pulse bg-gradient-to-b from-transparent via-primary/10 to-transparent" />
          )}
        </motion.div>
      </div>
    </div>
  );
}

function StatusDot({ phase }: { phase: Phase }) {
  const color =
    phase === 'done'
      ? 'bg-primary'
      : phase === 'generating'
        ? 'bg-amber-400'
        : 'bg-white/40';
  return (
    <span className="relative inline-flex size-2 items-center justify-center">
      <span className={`absolute inline-flex size-2 animate-ping rounded-full ${color} opacity-60`} />
      <span className={`relative inline-flex size-1.5 rounded-full ${color}`} />
    </span>
  );
}

function Card({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-[oklch(0.18_0.005_250)] shadow-xl shadow-black/30">
      <div className="flex items-center justify-between border-b border-white/5 px-3 py-1.5">
        <div className="flex gap-1.5">
          <span className="size-2 rounded-full bg-white/20" />
          <span className="size-2 rounded-full bg-white/20" />
          <span className="size-2 rounded-full bg-white/20" />
        </div>
        <span className="font-mono text-[10px] text-muted-foreground">{label}</span>
        <span className="w-8" />
      </div>
      <div className="p-3">{children}</div>
    </div>
  );
}
