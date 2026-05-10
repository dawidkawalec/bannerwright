import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function LandingCtaFooter() {
  return (
    <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 sm:pb-24">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-blue-500 to-violet-500 p-8 text-primary-foreground sm:p-12">
        <div className="pointer-events-none absolute -right-12 -top-12 size-56 rounded-full bg-white/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 size-64 rounded-full bg-white/10 blur-3xl" />

        <div className="relative z-10 grid grid-cols-1 items-center gap-6 lg:grid-cols-[1fr_auto]">
          <div>
            <h2 className="text-balance text-2xl font-semibold leading-tight sm:text-3xl">
              Open the workshop.
              <span className="block opacity-80">Make your first banner.</span>
            </h2>
            <p className="mt-2 max-w-xl text-sm text-primary-foreground/85">
              Single-tenant by default — your install, your brand, your AI keys. MIT-licensed, runs
              in one Docker container.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg" variant="secondary" className="h-11 px-5 text-sm">
              <Link href="/login">
                Sign in
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-11 border-white/30 bg-white/10 px-5 text-sm text-primary-foreground backdrop-blur hover:bg-white/20"
            >
              <a
                href="https://github.com/anthropics/bannerwright"
                target="_blank"
                rel="noreferrer"
              >
                View on GitHub
              </a>
            </Button>
          </div>
        </div>
      </div>

      <footer className="mt-10 flex flex-col items-center justify-between gap-2 text-xs text-muted-foreground sm:flex-row">
        <p>© {new Date().getFullYear()} Bannerwright — open source under MIT.</p>
        <p>
          <Link href="/login" className="hover:text-foreground">
            Sign in
          </Link>{' '}
          ·{' '}
          <a
            href="https://github.com/anthropics/bannerwright"
            className="hover:text-foreground"
            target="_blank"
            rel="noreferrer"
          >
            GitHub
          </a>
        </p>
      </footer>
    </section>
  );
}
