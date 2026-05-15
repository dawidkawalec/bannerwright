import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LetterReveal } from './letter-reveal';
import { GithubIcon } from './github-icon';

export function FinalCTA() {
  return (
    <section id="early-access" className="relative overflow-hidden px-6 py-28 md:py-40">
      <div className="bw-hero-bg pointer-events-none absolute inset-0 -z-10 opacity-80" />
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

      <div className="mx-auto max-w-3xl text-center">
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
