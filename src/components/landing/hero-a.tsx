'use client';

import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LetterReveal } from './letter-reveal';
import { HeroAReel } from './hero-a-reel';
import { GithubIcon } from './github-icon';

export function HeroA() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="bw-hero-bg relative overflow-hidden px-6 pt-16 pb-24 md:pt-24 md:pb-32">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[60vh] bg-[radial-gradient(ellipse_at_top,oklch(0.74_0.21_152_/_0.18),transparent_60%)]" />

      <div className="mx-auto grid max-w-6xl items-center gap-12 md:grid-cols-[1.1fr_1fr] md:gap-16">
        <div>
          <motion.span
            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] text-muted-foreground"
          >
            <span className="size-1.5 rounded-full bg-primary" />
            Open source · Self-hosted · BYOM
          </motion.span>

          <LetterReveal
            as="h1"
            text="The AI workshop for HTML banners."
            className="mt-6 block text-balance text-[clamp(2.5rem,6vw,4.25rem)] font-light leading-[1.05] tracking-[-0.02em] text-foreground"
          />

          <motion.p
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mt-6 max-w-xl text-pretty text-base text-muted-foreground md:text-lg"
          >
            Brief in. Brand-perfect creatives out — as editable HTML, ready to export. Self-hosted,
            AI-driven, no vendor lock-in.
          </motion.p>

          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="mt-9 flex flex-wrap items-center gap-3"
          >
            <Button asChild size="lg" className="h-11 px-5 text-sm">
              <Link href="/login">
                Start building
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-11 px-5 text-sm">
              <a
                href="https://github.com/dawidkawalec/bannerwright"
                target="_blank"
                rel="noreferrer"
              >
                <GithubIcon className="size-4" />
                View on GitHub
              </a>
            </Button>
          </motion.div>

          <motion.p
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={reduceMotion ? undefined : { opacity: 1 }}
            transition={{ duration: 0.6, delay: 1.1 }}
            className="mt-6 text-xs text-muted-foreground/80"
          >
            MIT licensed · One VPS · Your AI keys · Zero telemetry
          </motion.p>
        </div>

        <motion.div
          initial={reduceMotion ? false : { opacity: 0, x: 20 }}
          animate={reduceMotion ? undefined : { opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <HeroAReel />
        </motion.div>
      </div>
    </section>
  );
}
