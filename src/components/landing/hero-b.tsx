'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LetterReveal } from './letter-reveal';
import { GithubIcon } from './github-icon';

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

// Each row gets a different drift speed + reversed direction for organic feel.
const ROWS = [
  { speed: 60, direction: 1, offset: 0 },
  { speed: 80, direction: -1, offset: 3 },
  { speed: 70, direction: 1, offset: 6 },
];

export function HeroB() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="relative overflow-hidden bg-[oklch(0.12_0.005_250)] pt-16 pb-24 md:pt-20 md:pb-32">
      {/* Banner wall — radial mask so the wall reads as a soft glow of creatives behind the H1
          rather than a hard edge-to-edge grid. Banners are visible across most of the hero
          (35% solid, fading to 0 by 85%), with the corners settling into the dark base. */}
      <div className="pointer-events-none absolute inset-0 -z-0 flex flex-col gap-4 py-4 [mask-image:radial-gradient(ellipse_at_center,#000_35%,transparent_85%)]">
        {ROWS.map((row, ri) => (
          <BannerMarquee
            key={ri}
            row={row}
            paused={reduceMotion ?? false}
          />
        ))}
      </div>

      {/* Dark wash over the whole hero — heaviest behind the H1, still pronounced at the rim.
          Whole section reads as uniformly dim; the banner wall comes through as accents, never
          competing with the centred copy. */}
      <div className="pointer-events-none absolute inset-0 -z-0 bg-[radial-gradient(ellipse_at_center,oklch(0.08_0.005_250_/_0.72)_0%,oklch(0.08_0.005_250_/_0.82)_55%,oklch(0.08_0.005_250_/_0.92)_80%,oklch(0.08_0.005_250)_100%)]" />

      {/* Foreground */}
      <div className="relative z-10 mx-auto max-w-3xl px-6 text-center">
        <motion.span
          initial={reduceMotion ? false : { opacity: 0, y: 8 }}
          animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-3 py-1 text-[11px] text-muted-foreground backdrop-blur"
        >
          <span className="size-1.5 rounded-full bg-primary" />
          Every creative below was generated from a one-line brief
        </motion.span>

        <LetterReveal
          as="h1"
          text="Every brand. Every format. In under a minute."
          className="mt-7 block text-balance text-[clamp(2.5rem,6.5vw,4.75rem)] font-light leading-[1.04] tracking-[-0.02em] text-foreground [text-shadow:0_2px_24px_rgba(0,0,0,0.55)]"
        />

        <motion.p
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="mx-auto mt-7 max-w-2xl text-pretty text-base text-muted-foreground md:text-lg"
        >
          Drop a URL. Type a brief. Get editable HTML — Instagram, LinkedIn, story, OG card, real
          estate listing, podcast cover, restaurant promo. Pick your output.
        </motion.p>

        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.9 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-3"
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
          transition={{ duration: 0.6, delay: 1.2 }}
          className="mt-7 text-xs text-muted-foreground/80"
        >
          MIT licensed · Self-hosted · Your AI keys · Zero telemetry
        </motion.p>
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
    <div className="group relative overflow-hidden">
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
            className="relative aspect-square h-44 shrink-0 overflow-hidden rounded-xl border border-white/10 shadow-xl shadow-black/40 md:h-56"
          >
            <Image
              src={src}
              alt=""
              fill
              sizes="(min-width: 768px) 220px, 180px"
              className="object-cover"
            />
          </div>
        ))}
      </motion.div>
    </div>
  );
}
