'use client';

import Image from 'next/image';
import { useRef, useState, type ReactNode } from 'react';
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
  useMotionValueEvent,
  type MotionValue,
} from 'framer-motion';
import {
  Globe,
  Palette,
  MessageSquare,
  Code2,
  ImageIcon,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type Step = {
  id: string;
  label: string;
  icon: LucideIcon;
  preview: 'url' | 'brand' | 'brief' | 'html' | 'png';
};

const STEPS: Step[] = [
  { id: 'p-url', label: 'URL', icon: Globe, preview: 'url' },
  { id: 'p-brand', label: 'Brand', icon: Palette, preview: 'brand' },
  { id: 'p-brief', label: 'Brief', icon: MessageSquare, preview: 'brief' },
  { id: 'p-html', label: 'HTML', icon: Code2, preview: 'html' },
  { id: 'p-png', label: 'PNG', icon: ImageIcon, preview: 'png' },
];

const ENDPOINT_BANNERS = [
  {
    src: '/landing/banners/01-maple-holiday-drop.png',
    alt: 'Holiday drop banner for Maple & Co.',
  },
  {
    src: '/landing/banners/04-olivetto-summer-menu.png',
    alt: 'Summer menu banner for Olivetto',
  },
  {
    src: '/landing/banners/06-foundry-coffee-opening.png',
    alt: 'Grand opening banner for Foundry Coffee',
  },
];

// Step k lights up between scrollProgress START_OFFSET + k*WINDOW … +WINDOW.
// 5 steps span ~0.10 → 0.68 of the scrollable runway, then banners take 0.7 → 1.
// STEP_START must be >= STEP_LEAD_IN so that `start - STEP_LEAD_IN` never goes negative
// (negative keyframe offsets crash native WAAPI on mount).
const STEP_START = 0.1;
const STEP_WINDOW = 0.12;
const STEP_LEAD_IN = 0.08;

const BANNER_PHASE_ONE: [number, number] = [0.7, 0.82];
const BANNER_PHASE_TWO: [number, number] = [0.78, 0.9];
const BANNER_PHASE_THREE: [number, number] = [0.86, 0.98];

export function PipelineSection() {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end end'],
  });

  // Header subtly fades as the user nears the end of the section.
  const headerOpacity = useTransform(scrollYProgress, [0, 0.85, 1], [1, 1, 0.7]);

  if (reduceMotion) {
    return <StaticFallback />;
  }

  return (
    <section
      ref={ref}
      id="pipeline"
      className="relative bg-[oklch(0.17_0.005_250)]"
      // ~3.5 viewports tall — gives the sticky container ~2.5 viewports of dwell
      // time for the steps to light up and the banners to slide in.
      style={{ height: '350vh' }}
    >
      <div className="sticky top-16 flex h-[calc(100vh-4rem)] flex-col overflow-hidden">
        <div className="mx-auto flex h-full w-full max-w-6xl flex-col justify-center px-6 pt-8 pb-12">
          {/* Header — stays near the top of the sticky frame */}
          <motion.div style={{ opacity: headerOpacity }} className="mb-10 max-w-2xl">
            <span className="text-xs font-medium uppercase tracking-[0.18em] text-primary">
              How it works
            </span>
            <h2 className="mt-3 text-balance text-[clamp(1.75rem,3.2vw,2.5rem)] font-light leading-[1.1] tracking-[-0.02em] text-foreground">
              URL to PNG — in five inspectable steps.
            </h2>
            <p className="mt-3 max-w-xl text-pretty text-sm text-muted-foreground md:text-base">
              Drop a client URL. Bannerwright captures the brand brief, drafts a creative, streams
              HTML, and renders the PNG — each step visible, editable, version-controlled.
            </p>
          </motion.div>

          {/* 5 step cards — horizontal row, each lights up at its own scroll window */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
            {STEPS.map((step, i) => (
              <StepCard
                key={step.id}
                step={step}
                index={i}
                progress={scrollYProgress}
              />
            ))}
          </div>

          {/* Endpoint — 3 banners slide in once the pipeline has lit up */}
          <BannerEndpoint progress={scrollYProgress} />
        </div>
      </div>
    </section>
  );
}

function StepCard({
  step,
  index,
  progress,
}: {
  step: Step;
  index: number;
  progress: MotionValue<number>;
}) {
  const Icon = step.icon;
  const start = STEP_START + index * STEP_WINDOW;
  const leadIn = Math.max(0, start - STEP_LEAD_IN);
  // Fade + lift in over a short window leading up to each step.
  const opacity = useTransform(progress, [leadIn, start], [0.18, 1]);
  const y = useTransform(progress, [leadIn, start], [16, 0]);
  // Border glow ramps to 1 when the step is "active", stays at 0.45 after the next step takes over.
  const glow = useTransform(
    progress,
    [Math.max(0, start - 0.02), start + 0.02, Math.min(1, start + STEP_WINDOW)],
    [0, 1, 0.45],
  );

  return (
    <motion.div
      style={{ opacity, y }}
      className="relative overflow-hidden rounded-xl border border-white/10 bg-[oklch(0.2_0.008_250)]"
    >
      <motion.div
        aria-hidden
        style={{ opacity: glow }}
        className="pointer-events-none absolute inset-0 rounded-xl border border-primary/40 shadow-[0_0_0_1px_oklch(0.74_0.21_152_/_0.35),0_8px_30px_-12px_oklch(0.74_0.21_152_/_0.4)]"
      />

      <div className="flex items-center justify-between border-b border-white/5 px-3 py-1.5 text-[10px] uppercase tracking-[0.18em]">
        <span className="flex items-center gap-1.5 text-primary">
          <Icon className="size-3.5" />
          {step.label}
        </span>
        <span className="font-mono text-muted-foreground/70">
          {index + 1}/{STEPS.length}
        </span>
      </div>
      <div className="p-3">
        <StepPreview kind={step.preview} />
      </div>
    </motion.div>
  );
}

function BannerEndpoint({ progress }: { progress: MotionValue<number> }) {
  // Toggle reveal via React state — bypasses a Framer Motion 12 quirk where
  // opacity bound to a derived MotionValue stays stuck at the initial sample.
  // We only need 4 discrete stages (0..3), so a coarse-grained state setter is fine.
  const [stage, setStage] = useState(0);

  useMotionValueEvent(progress, 'change', (v) => {
    const next = v >= BANNER_PHASE_THREE[0] ? 3 : v >= BANNER_PHASE_TWO[0] ? 2 : v >= BANNER_PHASE_ONE[0] ? 1 : 0;
    setStage((prev) => (prev === next ? prev : next));
  });

  const slotClass =
    'relative aspect-[4/3] overflow-hidden rounded-xl border border-white/10 shadow-2xl shadow-black/40 transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]';
  const ringClass = 'pointer-events-none absolute inset-0 ring-1 ring-inset ring-primary/15';

  return (
    <div className="mt-8 grid grid-cols-3 gap-3 md:gap-4">
      <div
        className={cn(
          slotClass,
          stage >= 1 ? 'translate-x-0 opacity-100' : '-translate-x-12 opacity-0',
        )}
      >
        <Image
          src={ENDPOINT_BANNERS[0].src}
          alt={ENDPOINT_BANNERS[0].alt}
          fill
          sizes="(min-width: 768px) 22vw, 32vw"
          className="object-cover"
        />
        <div className={ringClass} />
      </div>
      <div
        className={cn(
          slotClass,
          stage >= 2 ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0',
        )}
      >
        <Image
          src={ENDPOINT_BANNERS[1].src}
          alt={ENDPOINT_BANNERS[1].alt}
          fill
          sizes="(min-width: 768px) 22vw, 32vw"
          className="object-cover"
        />
        <div className={ringClass} />
      </div>
      <div
        className={cn(
          slotClass,
          stage >= 3 ? 'translate-x-0 opacity-100' : 'translate-x-12 opacity-0',
        )}
      >
        <Image
          src={ENDPOINT_BANNERS[2].src}
          alt={ENDPOINT_BANNERS[2].alt}
          fill
          sizes="(min-width: 768px) 22vw, 32vw"
          className="object-cover"
        />
        <div className={ringClass} />
      </div>
    </div>
  );
}

function StepPreview({ kind }: { kind: Step['preview'] }) {
  switch (kind) {
    case 'url':
      return (
        <Frame>
          <div className="flex items-center gap-2 font-mono text-[11px] text-muted-foreground">
            <span className="text-primary/70">https://</span>
            <span className="text-foreground">maple-and-co.com</span>
          </div>
        </Frame>
      );
    case 'brand':
      return (
        <Frame>
          <div className="space-y-2">
            <div className="flex gap-1.5">
              {['#3F1B14', '#A04324', '#E9B98F', '#F4E8D4'].map((c) => (
                <span
                  key={c}
                  className="size-5 rounded-md ring-1 ring-white/10"
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
            <div className="text-[11px] text-muted-foreground">
              <span className="font-serif text-foreground">Aa</span> · Editorial Serif
            </div>
          </div>
        </Frame>
      );
    case 'brief':
      return (
        <Frame>
          <pre className="whitespace-pre-wrap font-mono text-[10px] leading-relaxed text-muted-foreground">
{`> Holiday sale · IG square
  CTA: "Shop the drop"
  Voice: warm, confident`}
          </pre>
        </Frame>
      );
    case 'html':
      return (
        <Frame>
          <pre className="overflow-hidden font-mono text-[10px] leading-relaxed">
            <code>
              <span className="text-muted-foreground">&lt;section&gt;</span>
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
        </Frame>
      );
    case 'png':
      return (
        <Frame>
          <div className="relative aspect-square w-full overflow-hidden rounded-md ring-1 ring-primary/20">
            <Image
              src="/landing/banners/01-maple-holiday-drop.png"
              alt="Rendered banner"
              fill
              sizes="120px"
              className="object-cover"
            />
          </div>
        </Frame>
      );
  }
}

function Frame({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-[5.5rem] rounded-md border border-white/10 bg-black/30 p-2.5">
      {children}
    </div>
  );
}

function StaticFallback() {
  return (
    <section id="pipeline" className="relative bg-[oklch(0.17_0.005_250)] px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 max-w-2xl">
          <span className="text-xs font-medium uppercase tracking-[0.18em] text-primary">
            How it works
          </span>
          <h2 className="mt-3 text-balance text-[clamp(1.75rem,3.2vw,2.5rem)] font-light leading-[1.1] tracking-[-0.02em] text-foreground">
            URL to PNG — in five inspectable steps.
          </h2>
          <p className="mt-3 max-w-xl text-pretty text-sm text-muted-foreground md:text-base">
            Drop a client URL. Bannerwright captures the brand brief, drafts a creative, streams
            HTML, and renders the PNG — each step visible, editable, version-controlled.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <div
                key={step.id}
                className="overflow-hidden rounded-xl border border-white/10 bg-[oklch(0.2_0.008_250)]"
              >
                <div className="flex items-center justify-between border-b border-white/5 px-3 py-1.5 text-[10px] uppercase tracking-[0.18em]">
                  <span className="flex items-center gap-1.5 text-primary">
                    <Icon className="size-3.5" />
                    {step.label}
                  </span>
                  <span className="font-mono text-muted-foreground/70">
                    {i + 1}/{STEPS.length}
                  </span>
                </div>
                <div className="p-3">
                  <StepPreview kind={step.preview} />
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 grid grid-cols-3 gap-3 md:gap-4">
          {ENDPOINT_BANNERS.map((b) => (
            <div
              key={b.src}
              className={cn(
                'relative aspect-[4/3] overflow-hidden rounded-xl border border-white/10 shadow-2xl shadow-black/40',
              )}
            >
              <Image
                src={b.src}
                alt={b.alt}
                fill
                sizes="(min-width: 768px) 22vw, 32vw"
                className="object-cover"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
