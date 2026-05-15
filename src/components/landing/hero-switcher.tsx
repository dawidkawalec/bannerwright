'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';

const VARIANTS = [
  { id: 'a', label: 'A · Demo Reel' },
  { id: 'b', label: 'B · Banner Wall' },
  { id: 'c', label: 'C · Pipeline' },
];

export function HeroSwitcher() {
  const search = useSearchParams();
  const current = (search?.get('hero') ?? 'a').toLowerCase();

  return (
    <div className="fixed right-4 bottom-4 z-50 flex items-center gap-1 rounded-full border border-white/10 bg-background/90 p-1 text-[11px] shadow-2xl shadow-black/40 backdrop-blur-xl">
      <span className="px-2 text-[10px] uppercase tracking-[0.18em] text-muted-foreground/70">
        Hero
      </span>
      {VARIANTS.map((v) => {
        const isActive = (current === v.id) || (v.id === 'a' && !['a', 'b', 'c'].includes(current));
        return (
          <Link
            key={v.id}
            href={`/?hero=${v.id}#`}
            scroll={false}
            className={cn(
              'rounded-full px-2.5 py-1 font-medium transition-colors',
              isActive
                ? 'bg-primary/15 text-primary'
                : 'text-muted-foreground hover:text-foreground',
            )}
            aria-current={isActive ? 'true' : undefined}
          >
            {v.label}
          </Link>
        );
      })}
    </div>
  );
}
