'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Quote } from 'lucide-react';
import { SectionWrapper } from './section-wrapper';
import { cn } from '@/lib/utils';

// TODO: replace with real quotes before public launch
const TESTIMONIALS = [
  {
    quote: "I used to spend an hour per creative. Now it's a coffee break.",
    name: 'Marta K.',
    role: 'SoMe freelancer · 5 brand clients',
    initials: 'MK',
  },
  {
    quote: 'Brand-perfect work without onboarding a designer for every account.',
    name: 'Adam P.',
    role: 'Boutique agency owner',
    initials: 'AP',
  },
  {
    quote: 'Self-hosted means our brand brief never leaves our infra.',
    name: 'Jakub W.',
    role: 'Solo SaaS founder',
    initials: 'JW',
  },
  {
    quote: 'The chat editor finally feels like working with a junior designer, not a slot machine.',
    name: 'Anna R.',
    role: 'Community manager',
    initials: 'AR',
  },
];

export function TestimonialsCarousel() {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) return;
    const id = setInterval(() => {
      setDirection(1);
      setIndex((i) => (i + 1) % TESTIMONIALS.length);
    }, 6500);
    return () => clearInterval(id);
  }, [reduceMotion]);

  const go = (dir: 1 | -1) => {
    setDirection(dir);
    setIndex((i) => (i + dir + TESTIMONIALS.length) % TESTIMONIALS.length);
  };

  const current = TESTIMONIALS[index];

  return (
    <SectionWrapper id="use-cases">
      <div className="mb-12 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
        <div className="max-w-2xl">
          <span className="text-xs font-medium uppercase tracking-[0.18em] text-primary">
            Stories
          </span>
          <h2 className="mt-4 text-balance text-[clamp(2rem,4vw,3rem)] font-light leading-[1.1] tracking-[-0.02em] text-foreground">
            From makers who ship every day.
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Previous"
            className="flex size-10 items-center justify-center rounded-full border border-white/10 bg-background/40 text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            aria-label="Next"
            className="flex size-10 items-center justify-center rounded-full border border-white/10 bg-background/40 text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>

      <div className="relative min-h-[280px] overflow-hidden rounded-2xl border border-white/10 bg-[oklch(0.18_0.005_250)] p-8 md:p-12">
        <Quote className="absolute right-8 top-8 size-12 text-primary/15" />

        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={index}
            custom={direction}
            initial={reduceMotion ? false : { opacity: 0, x: direction * 24 }}
            animate={reduceMotion ? undefined : { opacity: 1, x: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, x: direction * -24 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
          >
            <p className="max-w-3xl text-balance text-[clamp(1.25rem,2.2vw,1.875rem)] font-light leading-snug tracking-tight text-foreground">
              &ldquo;{current.quote}&rdquo;
            </p>

            <div className="mt-8 flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-full bg-primary/15 text-sm font-medium text-primary">
                {current.initials}
              </span>
              <div>
                <div className="text-sm font-medium text-foreground">{current.name}</div>
                <div className="text-xs text-muted-foreground">{current.role}</div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-6 flex justify-center gap-1.5">
        {TESTIMONIALS.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => {
              setDirection(i > index ? 1 : -1);
              setIndex(i);
            }}
            aria-label={`Go to testimonial ${i + 1}`}
            className={cn(
              'h-1 rounded-full transition-all',
              i === index ? 'w-8 bg-primary' : 'w-1.5 bg-white/15 hover:bg-white/25',
            )}
          />
        ))}
      </div>
    </SectionWrapper>
  );
}
