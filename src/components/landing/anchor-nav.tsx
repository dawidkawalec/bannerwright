'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

const PILLS = [
  { id: 'brand-kb', label: 'Knowledge base' },
  { id: 'generation', label: 'Generation' },
  { id: 'chat-editor', label: 'AI editor' },
  { id: 'versioning', label: 'Versioning' },
  { id: 'templates', label: 'Templates' },
  { id: 'image-gen', label: 'AI imagery' },
];

// Sections that "own" the anchor nav. The bar appears while any of these
// are in viewport, and hides over hero / OSS / testimonials / CTA.
const OWNERS = ['features'];

export function AnchorNav() {
  const [active, setActive] = useState<string>(PILLS[0].id);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const owners = OWNERS.map((id) => document.getElementById(id)).filter(
      (el): el is HTMLElement => el !== null,
    );
    if (owners.length === 0) return;

    const ownerState = new Map<Element, boolean>();
    const ownerObserver = new IntersectionObserver(
      (entries) => {
        for (const e of entries) ownerState.set(e.target, e.isIntersecting);
        setVisible([...ownerState.values()].some(Boolean));
      },
      { threshold: 0, rootMargin: '-120px 0px -40% 0px' },
    );
    owners.forEach((el) => ownerObserver.observe(el));

    const pillEls = PILLS.map((p) => document.getElementById(p.id)).filter(
      (el): el is HTMLElement => el !== null,
    );
    const pillObserver = new IntersectionObserver(
      (entries) => {
        const top = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (top?.target.id) setActive(top.target.id);
      },
      { rootMargin: '-30% 0px -55% 0px', threshold: 0 },
    );
    pillEls.forEach((el) => pillObserver.observe(el));

    return () => {
      ownerObserver.disconnect();
      pillObserver.disconnect();
    };
  }, []);

  return (
    <div
      aria-hidden={!visible}
      className={cn(
        'pointer-events-none fixed inset-x-0 top-[5.25rem] z-30 flex justify-center px-6 transition-all duration-300',
        visible ? 'translate-y-0 opacity-100' : '-translate-y-3 opacity-0',
      )}
    >
      <nav
        className={cn(
          'flex max-w-full gap-1 overflow-x-auto rounded-full border border-white/10 bg-background/85 p-1 shadow-lg shadow-black/40 backdrop-blur-xl',
          visible && 'pointer-events-auto',
        )}
      >
        {PILLS.map((pill) => (
          <a
            key={pill.id}
            href={`#${pill.id}`}
            className={cn(
              'shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
              active === pill.id
                ? 'bg-primary/15 text-primary'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {pill.label}
          </a>
        ))}
      </nav>
    </div>
  );
}
