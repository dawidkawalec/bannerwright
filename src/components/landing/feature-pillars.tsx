'use client';

import { motion, useReducedMotion } from 'framer-motion';
import {
  Sparkles,
  Code2,
  MessageSquare,
  History,
  LayoutTemplate,
  ImagePlus,
  ArrowRight,
  type LucideIcon,
} from 'lucide-react';

type Feature = {
  id: string;
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  promise: string;
  bullets: string[];
};

const FEATURES: Feature[] = [
  {
    id: 'brand-kb',
    icon: Sparkles,
    eyebrow: 'Knowledge base',
    title: 'Brand Knowledge Base',
    promise: 'Drop a URL — we build the brand brief.',
    bullets: [
      'URL → live screenshot capture',
      'Auto-extracted colors & fonts',
      'Voice & tone analysis',
      'Logo detection from favicons & headers',
    ],
  },
  {
    id: 'generation',
    icon: Code2,
    eyebrow: 'Generation',
    title: 'HTML Generation',
    promise: 'Briefs become editable HTML in ~30 seconds.',
    bullets: [
      'Gemini 3.1 Pro with brand context',
      'Pixel-perfect typography',
      'Deterministic Playwright exports',
      'PNG ready on a single click',
    ],
  },
  {
    id: 'chat-editor',
    icon: MessageSquare,
    eyebrow: 'AI editor',
    title: 'AI Chat Editor',
    promise: 'Refine creatives by talking, not clicking.',
    bullets: [
      'Multi-turn conversational context',
      'Full HTML rewrite per turn',
      'Live preview alongside the chat',
      'Diff per version, side by side',
    ],
  },
  {
    id: 'versioning',
    icon: History,
    eyebrow: 'Versioning',
    title: 'Full Version History',
    promise: 'Every edit is a snapshot. Roll back anything.',
    bullets: [
      'Manual & AI edits captured',
      'Name and pin key versions',
      'Side-by-side visual diff',
      'Restore in one click',
    ],
  },
  {
    id: 'templates',
    icon: LayoutTemplate,
    eyebrow: 'Templates',
    title: 'Reusable Templates',
    promise: 'Promote any creative to a template.',
    bullets: [
      'Parent-generation lineage tracking',
      'Brand-aware fills across formats',
      'Batch export for variants',
      'Re-run with new briefs',
    ],
  },
  {
    id: 'image-gen',
    icon: ImagePlus,
    eyebrow: 'AI imagery',
    title: 'AI Imagery — Nano Banana',
    promise: 'Need a custom background? The model generates one.',
    bullets: [
      'On-demand only — no waste',
      'Embedded straight into HTML',
      'Style-controlled prompts',
      'Cached per generation',
    ],
  },
];

export function FeaturePillars() {
  const reduceMotion = useReducedMotion();

  return (
    <section id="features" className="relative px-6 py-24 md:py-32">
      <div className="mx-auto max-w-6xl">
        <div className="mb-14 max-w-2xl">
          <span className="text-xs font-medium uppercase tracking-[0.18em] text-primary">
            What it does
          </span>
          <h2 className="mt-4 text-balance text-[clamp(2rem,4vw,3rem)] font-light leading-[1.1] tracking-[-0.02em] text-foreground">
            Six pieces. One workshop.
          </h2>
          <p className="mt-4 text-pretty text-base text-muted-foreground">
            Every step from brief to export — brand extraction, generation, AI editing,
            versioning, templates, and on-demand imagery — owned end-to-end.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature, i) => (
            <motion.article
              key={feature.id}
              id={feature.id}
              initial={reduceMotion ? false : { opacity: 0, y: 20 }}
              whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
              className="group relative scroll-mt-32 overflow-hidden rounded-2xl border border-white/8 bg-[oklch(0.18_0.005_250)] p-6 transition-colors hover:border-primary/30"
            >
              <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

              <div className="mb-5 flex size-10 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-primary/20">
                <feature.icon className="size-5 text-primary" />
              </div>

              <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-primary/80">
                {feature.eyebrow}
              </span>
              <h3 className="mt-2 text-xl font-light tracking-tight text-foreground">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">{feature.promise}</p>

              <ul className="mt-5 space-y-2 border-t border-white/5 pt-5">
                {feature.bullets.map((b) => (
                  <li
                    key={b}
                    className="flex items-start gap-2 text-[13px] text-muted-foreground"
                  >
                    <ArrowRight className="mt-0.5 size-3 shrink-0 text-primary/60" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
