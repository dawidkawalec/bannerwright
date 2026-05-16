'use client';

import { useState, useTransition, type ReactNode } from 'react';
import { toast } from 'sonner';
import { ArrowRight, Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { submitWaitlist, type WaitlistInputType } from '@/app/actions/waitlist';

type WaitlistSource = NonNullable<WaitlistInputType['source']>;

type WaitlistDialogProps = {
  /** What triggered the open — used for analytics + admin context */
  source?: WaitlistSource;
  /** Render a custom trigger; falls back to a textual button */
  children?: ReactNode;
  /** Controlled open state (for triggering from anywhere) */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function WaitlistDialog({
  source = 'direct',
  children,
  open,
  onOpenChange,
}: WaitlistDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;
  const setOpen = (v: boolean) => {
    if (isControlled) onOpenChange?.(v);
    else setInternalOpen(v);
  };

  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);

  function handleSubmit(formData: FormData) {
    const input: WaitlistInputType = {
      email: String(formData.get('email') ?? ''),
      name: String(formData.get('name') ?? ''),
      useCase: String(formData.get('useCase') ?? ''),
      source,
    };

    startTransition(async () => {
      const result = await submitWaitlist(input);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setDone(true);
      toast.success(
        result.alreadyOnList
          ? "You're already on the list — we'll be in touch."
          : "You're on the list. We'll be in touch.",
      );
    });
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) setDone(false);
      }}
    >
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent className="sm:max-w-[440px]">
        {done ? (
          <SuccessPanel onClose={() => setOpen(false)} />
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-balance text-xl font-light tracking-tight">
                Request early access
              </DialogTitle>
              <DialogDescription className="text-pretty">
                Bannerwright is in private beta. Drop your email and a sentence about what you&apos;d
                build — we&apos;ll send a setup invite once your slot is up.
              </DialogDescription>
            </DialogHeader>

            <form action={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="wl-email">Email</Label>
                <Input
                  id="wl-email"
                  name="email"
                  type="email"
                  required
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="wl-name" className="flex items-center gap-2">
                  Name
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground/70">
                    optional
                  </span>
                </Label>
                <Input
                  id="wl-name"
                  name="name"
                  type="text"
                  placeholder="What should we call you?"
                  autoComplete="name"
                  maxLength={120}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="wl-usecase" className="flex items-center gap-2">
                  Use case
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground/70">
                    optional
                  </span>
                </Label>
                <textarea
                  id="wl-usecase"
                  name="useCase"
                  rows={3}
                  maxLength={500}
                  placeholder="Agency? Solo? 5 brand clients? Tell us in one line."
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>

              <div className="flex items-center justify-between gap-3 pt-2">
                <p className="text-[11px] text-muted-foreground/80">
                  One email, then silence until your slot opens.
                </p>
                <Button type="submit" disabled={pending} className="shrink-0">
                  {pending ? 'Saving…' : 'Request access'}
                  {!pending && <ArrowRight className="size-4" />}
                </Button>
              </div>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function SuccessPanel({ onClose }: { onClose: () => void }) {
  return (
    <div className="space-y-4 py-2">
      <div className="flex size-10 items-center justify-center rounded-full bg-primary/15 ring-1 ring-primary/30">
        <Check className="size-5 text-primary" />
      </div>
      <div>
        <DialogTitle className="text-balance text-xl font-light tracking-tight">
          You&apos;re on the list.
        </DialogTitle>
        <DialogDescription className="mt-2 text-pretty">
          We&apos;ll be in touch when your slot opens. Until then, the GitHub repo is the best
          place to watch progress.
        </DialogDescription>
      </div>
      <div className="flex items-center justify-end gap-2 pt-2">
        <Button variant="ghost" onClick={onClose}>
          Close
        </Button>
      </div>
    </div>
  );
}
