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

// Bounds where the anchor nav stays visible. Anything outside these IDs
// hides the pill bar so it doesn't overlap unrelated sections (hero, OSS, final CTA).
const VISIBLE_FROM = 'features';
const VISIBLE_TO = 'use-cases';

export function AnchorNav() {
  const [active, setActive] = useState<string>(PILLS[0].id);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const middle = window.scrollY + window.innerHeight / 2;

      const from = document.getElementById(VISIBLE_FROM);
      const to = document.getElementById(VISIBLE_TO);
      if (from && to) {
        const start = from.offsetTop - 120;
        const end = to.offsetTop + to.offsetHeight;
        setVisible(middle >= start && middle <= end);
      }

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
