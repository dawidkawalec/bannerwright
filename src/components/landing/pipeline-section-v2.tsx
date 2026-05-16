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

type PreviewKind = 'url' | 'brand' | 'brief' | 'html' | 'png';

type Step = {
  label: string;
  blurb: string;
  icon: LucideIcon;
  preview: PreviewKind;
};

const STEP_TEMPLATE: Step[] = [
  {
    label: 'URL',
    blurb:
      'Drop a client website — we screenshot it, scrape the markup, and start a brand profile.',
    icon: Globe,
    preview: 'url',
  },
  {
    label: 'Brand',
    blurb:
      'Colours, fonts, voice — extracted automatically from the live site and a few seed pages.',
    icon: Palette,
    preview: 'brand',
  },
  {
    label: 'Brief',
    blurb: 'Type the prompt as you would to a designer. Format, CTA, voice, vibe.',
    icon: MessageSquare,
    preview: 'brief',
  },
  {
    label: 'HTML',
    blurb:
      'Gemini drafts editable HTML — streamed live, version-controlled, never a black box.',
    icon: Code2,
    preview: 'html',
  },
  {
    label: 'PNG',
    blurb:
      'Playwright renders the final PNG. Ready to download, post, or reopen for edits.',
    icon: ImageIcon,
    preview: 'png',
  },
];

type ExampleFlow = {
  id: string;
  exampleLabel: string;
  title: string;
  tagline: string;
  url: string;
  brand: {
    palette: string[];
    fontPair: { display: string; meta: string };
    voiceTags: string[];
  };
  brief: string;
  htmlSnippet: { h2: string; p: string; cta: string };
  png: { src: string; alt: string };
};

const FLOWS: ExampleFlow[] = [
  {
    id: 'maple',
    exampleLabel: 'Example 1 of 2',
    title: 'Maple & Co. · Holiday Drop',
    tagline: 'From a brand URL to a printable PNG in under a minute.',
    url: 'maple-and-co.com',
    brand: {
      palette: ['#3F1B14', '#A04324', '#E9B98F', '#F4E8D4'],
      fontPair: { display: 'Aa', meta: 'Editorial Serif · Soft Sans for body' },
      voiceTags: ['warm', 'confident', 'editorial'],
    },
    brief: `> Holiday sale for maple-and-co.com
  - 1080×1080 · Instagram feed
  - CTA: "Shop the drop"
  - Voice: warm, confident
  - Discount: 40% for 48 hours`,
    htmlSnippet: {
      h2: 'Holiday Drop',
      p: 'Up to 40% off — 48 hours only',
      cta: 'Shop the drop →',
    },
    png: {
      src: '/landing/banners/01-maple-holiday-drop.png',
      alt: 'Holiday drop banner for Maple & Co.',
    },
  },
  {
    id: 'foundry',
    exampleLabel: 'Example 2 of 2',
    title: 'Foundry Coffee · Grand Opening',
    tagline: 'Same workshop, completely different brand — same five steps.',
    url: 'foundry-coffee.com',
    brand: {
      palette: ['#241408', '#7E4A1F', '#D4A88C', '#F5EDE0'],
      fontPair: { display: 'Aa', meta: 'Mid-century display · Soft sans body' },
      voiceTags: ['warm', 'slow craft', 'community'],
    },
    brief: `> Grand opening for foundry-coffee.com
  - 1080×1080 · Instagram feed
  - CTA: "Visit us today"
  - Voice: friendly, slow craft
  - Address: 47 Walker St · Tue–Sun 7–4`,
    htmlSnippet: {
      h2: 'Now Open',
      p: '47 Walker St · Tue–Sun 7–4',
      cta: 'Visit us today →',
    },
    png: {
      src: '/landing/banners/06-foundry-coffee-opening.png',
      alt: 'Grand opening banner for Foundry Coffee',
    },
  },
];

const TOTAL_STAGES = FLOWS.length * STEP_TEMPLATE.length; // 10

export function PipelineSectionV2() {
  const ref = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();
  const [stage, setStage] = useState(0);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end end'],
  });

  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    const next = Math.min(TOTAL_STAGES - 1, Math.max(0, Math.floor(v * TOTAL_STAGES)));
    setStage((prev) => (prev === next ? prev : next));
  });

  if (reduceMotion) {
    return <StaticFallback />;
  }

  const exampleIdx = Math.min(FLOWS.length - 1, Math.floor(stage / STEP_TEMPLATE.length));
  const stepIdx = stage % STEP_TEMPLATE.length;
  const example = FLOWS[exampleIdx];

  // Vertical accent line length: spans through current step within the current cycle (0..5).
  const accentPct = ((stepIdx + 0.5) / STEP_TEMPLATE.length) * 100;

  return (
    <section
      ref={ref}
      id="pipeline"
      className="relative bg-[oklch(0.15_0.005_250)]"
      // Long enough runway so each of the 10 stages gets ~70vh of dwell time.
      style={{ height: '700vh' }}
    >
      <div className="sticky top-16 flex h-[calc(100vh-4rem)] flex-col overflow-hidden">
        <div className="mx-auto grid h-full w-full max-w-6xl grid-cols-[1fr_1.4fr] gap-12 px-6 pt-10 pb-12">
          {/* LEFT — section header + brand badge + 5-step timeline */}
          <div className="flex flex-col">
            <span className="text-xs font-medium uppercase tracking-[0.18em] text-primary">
              How it works
            </span>
            <h2 className="mt-3 text-balance text-[clamp(1.75rem,3vw,2.5rem)] font-light leading-[1.1] tracking-[-0.02em] text-foreground">
              Two brands. Two banners.
              <br />
              The same five steps.
            </h2>

            {/* Brand badge swaps when the section crosses into example 2 */}
            <div className="relative mt-8 min-h-[5.5rem]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={example.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute inset-0"
                >
                  <span className="inline-flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.18em] text-primary">
                    <span className="inline-block h-1 w-6 rounded-full bg-primary/60" />
                    {example.exampleLabel}
                  </span>
                  <h3 className="mt-2 text-balance text-lg font-light leading-tight tracking-tight text-foreground">
                    {example.title}
                  </h3>
                  <p className="mt-1 max-w-md text-pretty text-xs text-muted-foreground">
                    {example.tagline}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            <ol className="relative mt-6 flex-1 space-y-2">
              <span
                aria-hidden
                className="absolute left-[0.875rem] top-2 bottom-2 w-px bg-white/8"
              />
              <motion.span
                aria-hidden
                className="absolute left-[0.875rem] top-2 w-px bg-gradient-to-b from-primary via-primary/60 to-transparent"
                animate={{ height: `${accentPct}%` }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              />
              {STEP_TEMPLATE.map((step, i) => (
                <StepRow
                  key={step.label}
                  step={step}
                  index={i}
                  isActive={i === stepIdx}
                  isPast={i < stepIdx}
                />
              ))}
            </ol>
          </div>

          {/* RIGHT — big preview, content swaps per (example, step) */}
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
                  {STEP_TEMPLATE[stepIdx].label} · {example.id} · step {stepIdx + 1}/
                  {STEP_TEMPLATE.length}
                </span>
                <span className="w-8" />
              </div>
              <div className="relative h-full w-full">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`${example.id}-${STEP_TEMPLATE[stepIdx].label}`}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -14 }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute inset-0 flex items-center justify-center p-6"
                  >
                    <BigPreview kind={STEP_TEMPLATE[stepIdx].preview} example={example} />
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
          <Icon
            className={cn('size-3.5', isActive ? 'text-primary' : 'text-muted-foreground/70')}
          />
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

function BigPreview({
  kind,
  example,
}: {
  kind: PreviewKind;
  example: ExampleFlow;
}) {
  switch (kind) {
    case 'url':
      return (
        <PreviewFrame>
          <div className="space-y-3 font-mono text-sm text-muted-foreground">
            <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/40 px-3 py-2">
              <span className="text-primary/70">https://</span>
              <span className="text-foreground">{example.url}</span>
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
              <span className="text-primary">✓</span> Found {example.brand.palette.length} brand
              colours, 2 fonts
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
                {example.brand.palette.map((c, i) => (
                  <motion.div
                    key={c}
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.4, delay: i * 0.08 }}
                    className="size-12 rounded-lg ring-1 ring-white/10"
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
                <span className="font-serif text-3xl text-foreground">
                  {example.brand.fontPair.display}
                </span>
                <div className="text-xs text-muted-foreground">
                  {example.brand.fontPair.meta}
                </div>
              </div>
            </div>
            <div>
              <div className="mb-2 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                Voice
              </div>
              <div className="flex flex-wrap gap-1.5">
                {example.brand.voiceTags.map((tag) => (
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
            {example.brief}
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
              <span className="text-foreground">{example.htmlSnippet.h2}</span>
              <span className="text-muted-foreground">&lt;/h2&gt;</span>
              {'\n'}
              <span className="text-muted-foreground/60">3</span>{'    '}
              <span className="text-muted-foreground">&lt;p&gt;</span>
              <span className="text-foreground">{example.htmlSnippet.p}</span>
              <span className="text-muted-foreground">&lt;/p&gt;</span>
              {'\n'}
              <span className="text-muted-foreground/60">4</span>{'    '}
              <span className="text-muted-foreground">&lt;a</span>{' '}
              <span className="text-primary">class</span>=
              <span className="text-foreground">&quot;cta&quot;</span>
              <span className="text-muted-foreground">&gt;</span>
              <span className="text-foreground">{example.htmlSnippet.cta}</span>
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
            src={example.png.src}
            alt={example.png.alt}
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
    <section id="pipeline" className="relative bg-[oklch(0.15_0.005_250)] px-6 py-16">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 max-w-2xl">
          <span className="text-xs font-medium uppercase tracking-[0.18em] text-primary">
            How it works
          </span>
          <h2 className="mt-3 text-balance text-[clamp(1.75rem,3vw,2.5rem)] font-light leading-[1.1] tracking-[-0.02em] text-foreground">
            Two brands. Two banners. The same five steps.
          </h2>
        </div>
        {FLOWS.map((example) => (
          <div key={example.id} className="mb-12">
            <h3 className="mb-4 text-lg font-light text-foreground">{example.title}</h3>
            <ol className="space-y-4">
              {STEP_TEMPLATE.map((step, i) => {
                const Icon = step.icon;
                return (
                  <li key={`${example.id}-${step.label}`} className="flex items-start gap-4">
                    <div className="flex size-7 items-center justify-center rounded-full border border-white/15 bg-[oklch(0.18_0.005_250)] font-mono text-[10px] text-muted-foreground">
                      {i + 1}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 text-foreground">
                        <Icon className="size-3.5 text-primary" />
                        <span className="text-sm font-medium tracking-tight">{step.label}</span>
                      </div>
                      <p className="mt-1 max-w-md text-[13px] text-muted-foreground">
                        {step.blurb}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        ))}
      </div>
    </section>
  );
}
