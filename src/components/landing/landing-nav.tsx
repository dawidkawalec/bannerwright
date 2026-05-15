'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Hammer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GithubIcon } from './github-icon';
import { cn } from '@/lib/utils';

const NAV_LINKS = [
  { href: '#features', label: 'Features' },
  { href: '#open-source', label: 'Open Source' },
  { href: '#use-cases', label: 'Use cases' },
  { href: '#metrics', label: 'Why' },
];

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={cn(
        'sticky top-0 z-40 w-full transition-all duration-300',
        scrolled
          ? 'border-b border-white/5 bg-background/80 backdrop-blur-xl'
          : 'border-b border-transparent bg-transparent',
      )}
    >
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-4">
        <Link href="/" className="flex items-center gap-2 text-foreground">
          <span className="flex size-7 items-center justify-center rounded-md bg-gradient-to-br from-primary to-primary/60 shadow-sm">
            <Hammer className="size-3.5 text-primary-foreground" />
          </span>
          <span className="text-sm font-medium tracking-tight">Bannerwright</span>
        </Link>

        <ul className="hidden items-center gap-7 md:flex">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
            <a
              href="https://github.com/dawidkawalec/bannerwright"
              target="_blank"
              rel="noreferrer"
            >
              <GithubIcon className="size-3.5" />
              Star
            </a>
          </Button>
          <Button asChild size="sm">
            <Link href="/login">Start building</Link>
          </Button>
        </div>
      </nav>
    </header>
  );
}
