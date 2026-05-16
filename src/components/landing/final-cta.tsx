import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LetterReveal } from './letter-reveal';
import { GithubIcon } from './github-icon';

// Static banner grid sitting behind the CTA — same vibe as the hero wall but
// not animated. Each row is a flex of square-ish banner thumbnails; rows are
// offset slightly so the seams aren't aligned.
const ROW_A = [
  '/landing/banners/01-maple-holiday-drop.png',
  '/landing/banners/04-olivetto-summer-menu.png',
  '/landing/banners/07-brushwork-academy-cohort.png',
  '/landing/banners/02-makers-hour-podcast.png',
  '/landing/banners/10-stillwater-studio.png',
  '/landing/banners/09-northbrook-loft-listing.png',
];
const ROW_B = [
  '/landing/banners/06-foundry-coffee-opening.png',
  '/landing/banners/09-northbrook-loft-listing.png',
  '/landing/banners/01-maple-holiday-drop.png',
  '/landing/banners/04-olivetto-summer-menu.png',
  '/landing/banners/07-brushwork-academy-cohort.png',
  '/landing/banners/02-makers-hour-podcast.png',
];

export function FinalCTA() {
  return (
    <section
      id="early-access"
      className="relative overflow-hidden bg-[oklch(0.12_0.005_250)] px-6 py-28 md:py-40"
    >
      {/* Banner wall — two static rows of thumbnails, the second offset for variation.
          z-0 puts the wall above the section's solid bg-colour but below the scrim & content. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 flex flex-col items-stretch justify-center gap-4 [mask-image:radial-gradient(ellipse_120%_70%_at_center,#000_50%,transparent_95%)]"
      >
        <div className="flex shrink-0 gap-4 px-[-2rem]">
          {ROW_A.map((src, i) => (
            <div
              key={`a-${i}`}
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
        </div>
        <div className="flex shrink-0 -translate-x-16 gap-4">
          {ROW_B.map((src, i) => (
            <div
              key={`b-${i}`}
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
        </div>
      </div>

      {/* Dark scrim — uniformly dim so banners read as accents behind the H1, never compete */}
      <div className="pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(ellipse_at_center,oklch(0.08_0.005_250_/_0.68)_0%,oklch(0.08_0.005_250_/_0.82)_60%,oklch(0.08_0.005_250)_95%)]" />

      {/* Thin teal divider line at the top edge */}
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
              Star on GitHub
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
}
