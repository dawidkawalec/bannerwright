'use client';

import { motion } from 'framer-motion';
import {
  Code2,
  Database,
  Image as ImageIcon,
  Layers,
  Sparkles,
  ZapOff,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const features = [
  {
    icon: Database,
    title: 'Brand-aware knowledge base',
    body: 'Drop a URL — Bannerwright opens it in a real browser, screenshots and extracts text. The AI sees the brand the way humans do.',
    gradient: 'from-emerald-500 to-teal-500',
  },
  {
    icon: Sparkles,
    title: 'Brief → HTML in ~30 s',
    body: 'Gemini 3.1 Pro composes a real HTML banner. No black box: the markup is right there, ready to inspect or hand-edit.',
    gradient: 'from-blue-500 to-indigo-500',
  },
  {
    icon: Layers,
    title: 'Versions, not magic',
    body: 'Every AI edit is a full rewrite saved as a new version. Restore any moment, branch, or promote a great banner to a template.',
    gradient: 'from-violet-500 to-purple-500',
  },
  {
    icon: ImageIcon,
    title: 'PNG export when you need it',
    body: 'Headless Playwright renders pixel-perfect PNGs at the format you choose — square, story, landscape or portrait.',
    gradient: 'from-rose-500 to-pink-500',
  },
  {
    icon: Code2,
    title: 'Editable HTML you own',
    body: 'Open the markup in the visual editor or full Monaco. The output is a file you can keep — not a render trapped in a SaaS.',
    gradient: 'from-amber-500 to-orange-500',
  },
  {
    icon: ZapOff,
    title: 'Self-hosted by design',
    body: 'Single container, single user, single Postgres. No queues, no telemetry, no vendor lock — your AI keys, your data.',
    gradient: 'from-cyan-500 to-sky-500',
  },
];

export function LandingFeatures() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">
          Why Bannerwright
        </p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          A workshop, not a black box.
        </h2>
        <p className="mt-3 text-base text-muted-foreground">
          Six things we did differently — so the AI is your apprentice, not the boss.
        </p>
      </div>

      <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f, i) => {
          const Icon = f.icon;
          return (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.35, delay: (i % 3) * 0.06 }}
              className="group relative rounded-2xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
            >
              <div
                className={cn(
                  'mb-4 grid size-11 place-items-center rounded-xl bg-gradient-to-br text-white shadow-sm',
                  f.gradient,
                )}
              >
                <Icon className="size-5" />
              </div>
              <h3 className="text-base font-semibold text-foreground">{f.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{f.body}</p>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
