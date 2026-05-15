'use client';

import Image from 'next/image';
import { useRef, useState, type ReactNode } from 'react';
import {
  AnimatePresence,
  motion,
  useScroll,
  useMotionValueEvent,
  useReducedMotion,
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
  blurb: string;
  icon: LucideIcon;
  preview: 'url' | 'brand' | 'brief' | 'html' | 'png';
};

const STEPS: Step[] = [
  {
    id: 'v2-url',
    label: 'URL',
    blurb: 'Drop a client website — we screenshot it, scrape the markup, and start a brand profile.',
    icon: Globe,
    preview: 'url',
  },
  {
    id: 'v2-brand',
    label: 'Brand',
    blurb: 'Colours, fonts, voice — extracted automatically from the live site and a few seed pages.',
    icon: Palette,
    preview: 'brand',
  },
  {
    id: 'v2-brief',
    label: 'Brief',
    blurb: 'Type the prompt as you would to a designer. Format, CTA, voice, vibe.',
    icon: MessageSquare,
    preview: 'brief',
  },
  {
    id: 'v2-html',
    label: 'HTML',
    blurb: 'Gemini drafts editable HTML — streamed live, version-controlled, never a black box.',
    icon: Code2,
    preview: 'html',
  },
  {
    id: 'v2-png',
    label: 'PNG',
    blurb: 'Playwright renders the final PNG. Ready to download, post, or reopen for edits.',
    icon: ImageIcon,
    preview: 'png',
  },
];

const PNG_BANNER = '/landing/banners/01-maple-holiday-drop.png';

export function PipelineSectionV2() {
  const ref = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();
  const [active, setActive] = useState(0);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end end'],
  });

  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    // Map scrollProgress 0..1 → step index 0..4. Slight bias so PNG step lingers.
    const bucket = Math.min(STEPS.length - 1, Math.floor(v * STEPS.length));
    setActive((prev) => (prev === bucket ? prev : bucket));
  });

  if (reduceMotion) {
    return <StaticFallback />;
  }

  return (
    <section
      ref={ref}
      id="pipeline-v2"
      className="relative bg-[oklch(0.15_0.005_250)]"
      style={{ height: '400vh' }}
    >
      <div className="sticky top-16 flex h-[calc(100vh-4rem)] flex-col overflow-hidden">
        <div className="mx-auto grid h-full w-full max-w-6xl grid-cols-[1fr_1.4fr] gap-12 px-6 pt-10 pb-12">
          {/* Left column — heading + vertical stepper */}
          <div className="flex flex-col">
            <span className="text-xs font-medium uppercase tracking-[0.18em] text-primary">
              How it works · split view
            </span>
            <h2 className="mt-3 text-balance text-[clamp(1.75rem,3vw,2.5rem)] font-light leading-[1.1] tracking-[-0.02em] text-foreground">
              One step at a time.
            </h2>
            <p className="mt-3 text-pretty text-sm text-muted-foreground">
              Scroll through the pipeline — each step takes the canvas and explains itself.
            </p>

            <ol className="relative mt-10 flex-1 space-y-2">
              {/* Connector line behind the dots */}
              <span
                aria-hidden
                className="absolute left-[0.875rem] top-2 bottom-2 w-px bg-white/8"
              />
              <motion.span
                aria-hidden
                className="absolute left-[0.875rem] top-2 w-px bg-gradient-to-b from-primary via-primary/60 to-transparent"
                animate={{ height: `${((active + 0.5) / STEPS.length) * 100}%` }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              />

              {STEPS.map((step, i) => (
                <StepRow
                  key={step.id}
                  step={step}
                  index={i}
                  isActive={i === active}
                  isPast={i < active}
                />
              ))}
            </ol>
          </div>

          {/* Right column — big preview that swaps per step */}
          <div className="relative flex h-full items-center justify-center">
            <div className="absolute -inset-6 -z-10 rounded-3xl bg-gradient-to-br from-primary/15 via-transparent to-transparent blur-2xl" />
            <div className="relative aspect-[5/4] w-full max-w-[640px] overflow-hidden rounded-2xl border border-white/10 bg-[oklch(0.18_0.005_250)] shadow-2xl shadow-black/50">
              <div className="flex items-center justify-between border-b border-white/5 px-4 py-2">
                <div className="flex gap-1.5">
                  <span className="size-2 rounded-full bg-white/15" />
                  <span className="size-2 rounded-full bg-white/15" />
                  <span className="size-2 rounded-full bg-white/15" />
                </div>
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  {STEPS[active].label} · step {active + 1}/{STEPS.length}
                </span>
                <span className="w-8" />
              </div>
              <div className="relative h-full w-full">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={STEPS[active].id}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -14 }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute inset-0 flex items-center justify-center p-6"
                  >
                    <BigPreview kind={STEPS[active].preview} />
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function StepRow({
  step,
  index,
  isActive,
  isPast,
}: {
  step: Step;
  index: number;
  isActive: boolean;
  isPast: boolean;
}) {
  const Icon = step.icon;
  return (
    <li className="relative flex items-start gap-4 py-3">
      <div
        className={cn(
          'relative z-10 flex size-7 shrink-0 items-center justify-center rounded-full border transition-all duration-500',
          isActive
            ? 'border-primary bg-[oklch(0.15_0.005_250)] text-primary'
            : isPast
              ? 'border-primary/40 bg-[oklch(0.15_0.005_250)] text-primary/70'
              : 'border-white/15 bg-[oklch(0.18_0.005_250)] text-muted-foreground/70',
        )}
      >
        {isActive && (
          <span className="absolute inset-0 animate-ping rounded-full bg-primary/30" />
        )}
        <span className="relative font-mono text-[10px] font-medium">{index + 1}</span>
      </div>

      <div className="min-w-0 flex-1">
        <div
          className={cn(
            'flex items-center gap-2 transition-colors duration-300',
            isActive ? 'text-foreground' : 'text-muted-foreground',
          )}
        >
          <Icon className={cn('size-3.5', isActive ? 'text-primary' : 'text-muted-foreground/70')} />
          <span className="text-sm font-medium tracking-tight">{step.label}</span>
        </div>
        <p
          className={cn(
            'mt-1 max-w-md text-[13px] leading-relaxed transition-colors duration-300',
            isActive ? 'text-muted-foreground' : 'text-muted-foreground/55',
          )}
        >
          {step.blurb}
        </p>
      </div>
    </li>
  );
}

function BigPreview({ kind }: { kind: Step['preview'] }) {
  switch (kind) {
    case 'url':
      return (
        <PreviewFrame>
          <div className="space-y-3 font-mono text-sm text-muted-foreground">
            <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/40 px-3 py-2">
              <span className="text-primary/70">https://</span>
              <span className="text-foreground">maple-and-co.com</span>
              <motion.span
                className="ml-auto inline-block h-3 w-1.5 bg-primary"
                animate={{ opacity: [1, 0, 1] }}
                transition={{ duration: 0.9, repeat: Infinity }}
              />
            </div>
            <div className="rounded-md border border-white/10 bg-black/30 p-3 text-[11px] leading-relaxed">
              <span className="text-primary/70">→</span> Capturing live screenshot…
              <br />
              <span className="text-primary/70">→</span> Parsing markup, fonts, images…
              <br />
              <span className="text-primary">✓</span> Found 4 brand colours, 2 fonts
            </div>
          </div>
        </PreviewFrame>
      );
    case 'brand':
      return (
        <PreviewFrame>
          <div className="space-y-5">
            <div>
              <div className="mb-2 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                Palette
              </div>
              <div className="flex gap-2">
                {['#3F1B14', '#A04324', '#E9B98F', '#F4E8D4'].map((c, i) => (
                  <motion.div
                    key={c}
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.4, delay: i * 0.08 }}
                    className="flex size-12 flex-col items-center justify-end rounded-lg ring-1 ring-white/10"
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
            <div>
              <div className="mb-2 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                Typography
              </div>
              <div className="flex items-center gap-4">
                <span className="font-serif text-3xl text-foreground">Aa</span>
                <div className="text-xs text-muted-foreground">
                  Editorial Serif
                  <br />
                  <span className="text-muted-foreground/60">Soft Sans for body</span>
                </div>
              </div>
            </div>
            <div>
              <div className="mb-2 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                Voice
              </div>
              <div className="flex flex-wrap gap-1.5">
                {['warm', 'confident', 'editorial'].map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-[11px] text-primary"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </PreviewFrame>
      );
    case 'brief':
      return (
        <PreviewFrame>
          <pre className="whitespace-pre-wrap font-mono text-[13px] leading-relaxed text-muted-foreground">
            <span className="text-primary/70">{'>'}</span> {'Holiday sale for maple-and-co.com\n'}
            {'  - 1080×1080 · Instagram feed\n'}
            {'  - CTA: '}<span className="text-foreground">{'"Shop the drop"'}</span>{'\n'}
            {'  - Voice: warm, confident\n'}
            {'  - Discount: '}<span className="text-foreground">40%</span>{' for 48 hours'}
            <motion.span
              className="ml-1 inline-block h-3 w-1.5 -translate-y-px bg-primary"
              animate={{ opacity: [1, 0, 1] }}
              transition={{ duration: 0.9, repeat: Infinity }}
            />
          </pre>
        </PreviewFrame>
      );
    case 'html':
      return (
        <PreviewFrame>
          <pre className="overflow-hidden font-mono text-[12px] leading-relaxed text-muted-foreground">
            <code>
              <span className="text-muted-foreground/60">1</span>{'  '}
              <span className="text-muted-foreground">&lt;section</span>{' '}
              <span className="text-primary">class</span>=
              <span className="text-foreground">&quot;banner&quot;</span>
              <span className="text-muted-foreground">&gt;</span>
              {'\n'}
              <span className="text-muted-foreground/60">2</span>{'    '}
              <span className="text-muted-foreground">&lt;h2&gt;</span>
              <span className="text-foreground">Holiday Drop</span>
              <span className="text-muted-foreground">&lt;/h2&gt;</span>
              {'\n'}
              <span className="text-muted-foreground/60">3</span>{'    '}
              <span className="text-muted-foreground">&lt;p&gt;</span>
              <span className="text-foreground">Up to 40% off — 48 hours only</span>
              <span className="text-muted-foreground">&lt;/p&gt;</span>
              {'\n'}
              <span className="text-muted-foreground/60">4</span>{'    '}
              <span className="text-muted-foreground">&lt;a</span>{' '}
              <span className="text-primary">class</span>=
              <span className="text-foreground">&quot;cta&quot;</span>
              <span className="text-muted-foreground">&gt;</span>
              <span className="text-foreground">Shop the drop →</span>
              <span className="text-muted-foreground">&lt;/a&gt;</span>
              {'\n'}
              <span className="text-muted-foreground/60">5</span>{'  '}
              <span className="text-muted-foreground">&lt;/section&gt;</span>
              <motion.span
                className="ml-1 inline-block h-3 w-1.5 -translate-y-px bg-primary"
                animate={{ opacity: [1, 0, 1] }}
                transition={{ duration: 0.9, repeat: Infinity }}
              />
            </code>
          </pre>
        </PreviewFrame>
      );
    case 'png':
      return (
        <div className="relative aspect-square w-full max-w-[360px] overflow-hidden rounded-xl ring-1 ring-primary/30 shadow-2xl shadow-black/40">
          <Image
            src={PNG_BANNER}
            alt="Rendered banner — Maple & Co. Holiday Drop"
            fill
            sizes="(min-width: 768px) 360px, 80vw"
            className="object-cover"
          />
        </div>
      );
  }
}

function PreviewFrame({ children }: { children: ReactNode }) {
  return <div className="w-full max-w-md">{children}</div>;
}

function StaticFallback() {
  return (
    <section
      id="pipeline-v2"
      className="relative bg-[oklch(0.15_0.005_250)] px-6 py-24"
    >
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 max-w-2xl">
          <span className="text-xs font-medium uppercase tracking-[0.18em] text-primary">
            How it works · split view
          </span>
          <h2 className="mt-3 text-balance text-[clamp(1.75rem,3vw,2.5rem)] font-light leading-[1.1] tracking-[-0.02em] text-foreground">
            One step at a time.
          </h2>
        </div>
        <ol className="space-y-6">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <li key={step.id} className="flex items-start gap-4">
                <div className="flex size-7 items-center justify-center rounded-full border border-white/15 bg-[oklch(0.18_0.005_250)] font-mono text-[10px] text-muted-foreground">
                  {i + 1}
                </div>
                <div>
                  <div className="flex items-center gap-2 text-foreground">
                    <Icon className="size-3.5 text-primary" />
                    <span className="text-sm font-medium tracking-tight">{step.label}</span>
                  </div>
                  <p className="mt-1 max-w-md text-[13px] text-muted-foreground">{step.blurb}</p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
