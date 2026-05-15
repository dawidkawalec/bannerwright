import Link from 'next/link';
import { Logo } from '@/components/brand/logo';

const COLUMNS = [
  {
    title: 'Product',
    links: [
      { label: 'Features', href: '#features' },
      { label: 'Open Source', href: '#open-source' },
      { label: 'Use cases', href: '#use-cases' },
      { label: 'Roadmap', href: 'https://github.com/dawidkawalec/bannerwright' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'GitHub', href: 'https://github.com/dawidkawalec/bannerwright' },
      { label: 'Issues', href: 'https://github.com/dawidkawalec/bannerwright/issues' },
      { label: 'License (MIT)', href: 'https://opensource.org/license/mit' },
      { label: 'Changelog', href: 'https://github.com/dawidkawalec/bannerwright/releases' },
    ],
  },
  {
    title: 'Connect',
    links: [
      { label: 'hello@kawalec.pl', href: 'mailto:hello@kawalec.pl' },
      { label: 'X / Twitter', href: 'https://twitter.com' },
      { label: 'Sign in', href: '/login' },
    ],
  },
];

export function LandingFooter() {
  return (
    <footer className="relative border-t border-white/5 bg-background px-6 py-16">
      <div className="mx-auto grid max-w-6xl gap-12 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div>
          <Link href="/" aria-label="Bannerwright — home" className="inline-flex">
            <Logo variant="wordmark" />
          </Link>
          <p className="mt-4 max-w-xs text-xs text-muted-foreground">
            An AI workshop for makers of HTML banners. Open source, self-hosted, yours.
          </p>
        </div>

        {COLUMNS.map((col) => (
          <div key={col.title}>
            <h4 className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground/80">
              {col.title}
            </h4>
            <ul className="mt-4 space-y-2.5">
              {col.links.map((link) => (
                <li key={link.href}>
                  {link.href.startsWith('http') || link.href.startsWith('mailto') ? (
                    <a
                      href={link.href}
                      target={link.href.startsWith('http') ? '_blank' : undefined}
                      rel="noreferrer"
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </a>
                  ) : (
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mx-auto mt-14 flex max-w-6xl flex-col items-center justify-between gap-3 border-t border-white/5 pt-6 text-xs text-muted-foreground/70 md:flex-row">
        <span>© {new Date().getFullYear()} Bannerwright · MIT licensed</span>
        <span>Crafted with care by makers, for makers.</span>
      </div>
    </footer>
  );
}
