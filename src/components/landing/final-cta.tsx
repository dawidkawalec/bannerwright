'use client';

import Image from 'next/image';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LetterReveal } from './letter-reveal';
import { GithubIcon } from './github-icon';
import { WaitlistDialog } from './waitlist-dialog';

// Same banner pool as the hero wall — reused so the bookend sections feel related.
const ALL_BANNERS = [
  '/landing/banners/01-maple-holiday-drop.png',
  '/landing/banners/02-makers-hour-podcast.png',
  '/landing/banners/04-olivetto-summer-menu.png',
  '/landing/banners/05-northsignal-ai-extraction.png',
  '/landing/banners/06-foundry-coffee-opening.png',
  '/landing/banners/07-brushwork-academy-cohort.png',
  '/landing/banners/08-weekly-brief-newsletter.png',
  '/landing/banners/09-northbrook-loft-listing.png',
  '/landing/banners/10-stillwater-studio.png',
  '/landing/banners/03-devsummit-berlin.png',
];

// Two rows, opposite directions, different speeds — lighter version of the hero wall.
const ROWS = [
  { speed: 70, direction: 1, offset: 0 },
  { speed: 90, direction: -1, offset: 4 },
];

export function FinalCTA() {
  const reduceMotion = useReducedMotion();

  return (
    <section
      id="early-access"
      className="relative overflow-hidden bg-[oklch(0.12_0.005_250)] px-6 py-28 md:py-40"
    >
      {/* Banner wall — marquee, soft radial mask + tight bottom-fade so the bookend stays calm */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 flex flex-col items-stretch justify-center gap-4 [mask-image:radial-gradient(ellipse_130%_75%_at_center,#000_55%,transparent_95%)]"
      >
        {ROWS.map((row, ri) => (
          <BannerMarquee key={ri} row={row} paused={reduceMotion ?? false} />
        ))}
      </div>

      {/* Dark wash — uniformly dim so banners read as gentle accents behind the H1 */}
      <div className="pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(ellipse_at_center,oklch(0.08_0.005_250_/_0.68)_0%,oklch(0.08_0.005_250_/_0.82)_60%,oklch(0.08_0.005_250)_95%)]" />

      {/* Thin brand-green divider at the top edge */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

      <div className="relative z-20 mx-auto max-w-3xl text-center">
        <LetterReveal
          as="h2"
          text="Build your first banner in 60 seconds."
          className="block text-balance text-[clamp(2rem,5vw,3.5rem)] font-light leading-[1.1] tracking-[-0.02em] text-foreground"
        />

        <p className="mx-auto mt-6 max-w-xl text-pretty text-base text-muted-foreground md:text-lg">
          Self-host in an evening. Generate creatives the next morning.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <WaitlistDialog source="final_cta">
            <Button size="lg" className="h-11 px-5 text-sm">
              Request early access
              <ArrowRight className="size-4" />
            </Button>
          </WaitlistDialog>
          <Button asChild variant="outline" size="lg" className="h-11 px-5 text-sm">
            <a
              href="https://github.com/dawidkawalec/bannerwright"
              target="_blank"
              rel="noreferrer"
            >
              <GithubIcon className="size-4" />
              Star on GitHub
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
}

function BannerMarquee({
  row,
  paused,
}: {
  row: { speed: number; direction: number; offset: number };
  paused: boolean;
}) {
  // Rotate the order so each row shows different banners side by side.
  const ordered = [...ALL_BANNERS.slice(row.offset), ...ALL_BANNERS.slice(0, row.offset)];
  // Duplicate the list so the marquee loops seamlessly.
  const looped = [...ordered, ...ordered];

  return (
    <div className="relative overflow-hidden">
      <motion.div
        className="flex gap-4 will-change-transform"
        animate={
          paused
            ? undefined
            : {
                x: row.direction > 0 ? ['0%', '-50%'] : ['-50%', '0%'],
              }
        }
        transition={{
          duration: row.speed,
          ease: 'linear',
          repeat: Infinity,
        }}
      >
        {looped.map((src, i) => (
          <div
            key={`${src}-${i}`}
            className="relative aspect-square h-40 shrink-0 overflow-hidden rounded-xl border border-white/10 shadow-xl shadow-black/40 md:h-48"
          >
            <Image
              src={src}
              alt=""
              fill
              sizes="(min-width: 768px) 192px, 160px"
              className="object-cover"
            />
          </div>
        ))}
      </motion.div>
    </div>
  );
}
