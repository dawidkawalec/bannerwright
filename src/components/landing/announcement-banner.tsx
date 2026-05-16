'use client';

import { ArrowRight } from 'lucide-react';
import { WaitlistDialog } from './waitlist-dialog';

export function AnnouncementBanner() {
  return (
    <div className="relative z-50 w-full border-b border-white/5 bg-black/40 backdrop-blur">
      <WaitlistDialog source="announcement_banner">
        <button
          type="button"
          className="group mx-auto flex w-full max-w-6xl items-center justify-center gap-2 px-6 py-2.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <span className="rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-primary">
            Beta
          </span>
          <span>Now in private beta — request early access</span>
          <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
        </button>
      </WaitlistDialog>
    </div>
  );
}
