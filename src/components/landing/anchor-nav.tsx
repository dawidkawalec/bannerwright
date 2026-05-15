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

export function AnchorNav() {
  const [active, setActive] = useState<string>(PILLS[0].id);

  useEffect(() => {
    const onScroll = () => {
      const middle = window.scrollY + window.innerHeight / 2;
      let current = PILLS[0].id;
      for (const pill of PILLS) {
        const el = document.getElementById(pill.id);
        if (el && el.offsetTop <= middle) current = pill.id;
      }
      setActive(current);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="sticky top-16 z-30 flex w-full justify-center px-6 py-3 backdrop-blur-md">
      <nav className="flex max-w-full gap-1 overflow-x-auto rounded-full border border-white/10 bg-background/70 p-1 shadow-lg shadow-black/40">
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
