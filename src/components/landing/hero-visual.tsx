'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { useEffect, useState } from 'react';

const BRIEF = `> Generate a holiday sale banner for acme.com
  - 1200×628 · Instagram feed
  - CTA: "Shop the drop"
  - Voice: warm, confident`;

export function HeroVisual() {
  const reduceMotion = useReducedMotion();
  const [brief, setBrief] = useState(reduceMotion ? BRIEF : '');
  const [showHtml, setShowHtml] = useState(Boolean(reduceMotion));
  const [showBanner, setShowBanner] = useState(Boolean(reduceMotion));

  useEffect(() => {
    if (reduceMotion) return;
    let i = 0;
    const id = setInterval(() => {
      setBrief(BRIEF.slice(0, i));
      i += 2;
      if (i > BRIEF.length) {
        clearInterval(id);
        setTimeout(() => setShowHtml(true), 250);
        setTimeout(() => setShowBanner(true), 900);
      }
    }, 22);
    return () => clearInterval(id);
  }, [reduceMotion]);

  return (
    <div className="relative">
      <div className="absolute -inset-4 -z-10 rounded-3xl bg-gradient-to-br from-primary/20 via-transparent to-transparent blur-2xl" />

      <div className="grid gap-3">
        <Card label="brief.md">
          <pre className="whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-muted-foreground">
            {brief}
            {!reduceMotion && brief.length < BRIEF.length && (
              <span className="ml-0.5 inline-block h-3 w-1.5 -translate-y-px animate-pulse bg-primary" />
            )}
          </pre>
        </Card>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={showHtml ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
        >
          <Card label="banner.html">
            <pre className="overflow-x-auto font-mono text-[11px] leading-relaxed">
              <code className="text-foreground">
                <span className="text-muted-foreground">&lt;section</span>{' '}
                <span className="text-primary">class</span>=
                <span className="text-foreground">&quot;banner&quot;</span>
                <span className="text-muted-foreground">&gt;</span>
                {'\n  '}
                <span className="text-muted-foreground">&lt;h2&gt;</span>Holiday drop is live.
                <span className="text-muted-foreground">&lt;/h2&gt;</span>
                {'\n  '}
                <span className="text-muted-foreground">&lt;p&gt;</span>Up to 40% off — for 48 hours.
                <span className="text-muted-foreground">&lt;/p&gt;</span>
                {'\n  '}
                <span className="text-muted-foreground">&lt;a&gt;</span>Shop the drop →
                <span className="text-muted-foreground">&lt;/a&gt;</span>
                {'\n'}
                <span className="text-muted-foreground">&lt;/section&gt;</span>
              </code>
            </pre>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={showBanner ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <Card label="banner.png · 1200×628">
            <div className="relative aspect-[1200/628] w-full overflow-hidden rounded-md">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,oklch(0.74_0.21_152_/_0.35),transparent_55%),radial-gradient(ellipse_at_bottom_right,oklch(0.6_0.21_290_/_0.3),transparent_55%),linear-gradient(135deg,oklch(0.2_0.02_250),oklch(0.16_0.02_173))]" />
              <div className="absolute inset-0 flex flex-col justify-center gap-2 p-6 md:p-8">
                <span className="text-[10px] font-medium uppercase tracking-widest text-primary">
                  Holiday drop
                </span>
                <h3 className="text-lg font-light leading-tight tracking-tight text-foreground sm:text-2xl md:text-3xl">
                  Holiday drop is live.
                </h3>
                <p className="max-w-[26ch] text-xs text-muted-foreground md:text-sm">
                  Up to 40% off — for 48 hours.
                </p>
                <div className="mt-1">
                  <span className="inline-flex items-center gap-1 rounded-md bg-primary px-2.5 py-1 text-[10px] font-medium text-primary-foreground md:text-xs">
                    Shop the drop →
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

function Card({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-[oklch(0.18_0.005_250)] shadow-2xl shadow-black/40">
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
