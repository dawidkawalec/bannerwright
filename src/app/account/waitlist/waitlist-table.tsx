'use client';

import { useTransition } from 'react';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';
import type { WaitlistSignup, WaitlistStatus } from '@/lib/db/schema';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { removeSignup, setSignupStatus } from './actions';

const STATUSES: WaitlistStatus[] = ['pending', 'contacted', 'installed', 'declined'];

const STATUS_TONE: Record<WaitlistStatus, string> = {
  pending: 'border-amber-400/40 bg-amber-400/10 text-amber-300',
  contacted: 'border-primary/40 bg-primary/10 text-primary',
  installed: 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300',
  declined: 'border-zinc-500/40 bg-zinc-500/10 text-zinc-400',
};

export function WaitlistTable({ signups }: { signups: WaitlistSignup[] }) {
  if (signups.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card/40 p-12 text-center">
        <p className="text-sm text-muted-foreground">
          No signups yet. The marketing CTA opens a dialog that lands them here.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <table className="w-full text-sm">
        <thead className="border-b border-border bg-card/60 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          <tr>
            <th className="px-4 py-3 text-left font-medium">Email · Name</th>
            <th className="px-4 py-3 text-left font-medium">Use case</th>
            <th className="px-4 py-3 text-left font-medium">Source</th>
            <th className="px-4 py-3 text-left font-medium">Signed up</th>
            <th className="px-4 py-3 text-left font-medium">Status</th>
            <th className="px-4 py-3 text-right font-medium" />
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {signups.map((s) => (
            <Row key={s.id} signup={s} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Row({ signup }: { signup: WaitlistSignup }) {
  const [pending, startTransition] = useTransition();

  function handleStatusChange(value: WaitlistStatus) {
    startTransition(async () => {
      try {
        await setSignupStatus({ id: signup.id, status: value });
        toast.success(`Marked as ${value}`);
      } catch {
        toast.error('Could not update status');
      }
    });
  }

  function handleDelete() {
    if (!confirm(`Remove ${signup.email} from the waitlist?`)) return;
    startTransition(async () => {
      try {
        await removeSignup(signup.id);
        toast.success('Signup removed');
      } catch {
        toast.error('Could not remove');
      }
    });
  }

  return (
    <tr className={cn('hover:bg-muted/40', pending && 'opacity-50')}>
      <td className="px-4 py-3 align-top">
        <div className="font-mono text-[13px] text-foreground">{signup.email}</div>
        {signup.name && (
          <div className="mt-0.5 text-xs text-muted-foreground">{signup.name}</div>
        )}
      </td>
      <td className="px-4 py-3 align-top text-xs text-muted-foreground">
        {signup.useCase ? (
          <span className="line-clamp-3 max-w-md whitespace-pre-wrap">{signup.useCase}</span>
        ) : (
          <span className="text-muted-foreground/50">—</span>
        )}
      </td>
      <td className="px-4 py-3 align-top">
        {signup.source ? (
          <Badge variant="outline" className="text-[10px] font-mono">
            {signup.source}
          </Badge>
        ) : (
          <span className="text-muted-foreground/50">—</span>
        )}
      </td>
      <td className="whitespace-nowrap px-4 py-3 align-top text-xs text-muted-foreground">
        {new Date(signup.createdAt).toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })}
      </td>
      <td className="px-4 py-3 align-top">
        <Select
          value={signup.status}
          onValueChange={(v) => handleStatusChange(v as WaitlistStatus)}
          disabled={pending}
        >
          <SelectTrigger
            className={cn(
              'h-7 w-[120px] border text-[11px] capitalize',
              STATUS_TONE[signup.status],
            )}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s} className="text-xs capitalize">
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </td>
      <td className="px-4 py-3 align-top text-right">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={handleDelete}
          disabled={pending}
          aria-label="Remove signup"
        >
          <Trash2 className="size-3.5" />
        </Button>
      </td>
    </tr>
  );
}
