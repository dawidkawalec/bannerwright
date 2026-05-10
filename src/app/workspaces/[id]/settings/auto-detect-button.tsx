'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { autoDetectBrand } from '@/app/actions/workspaces';

export function AutoDetectButton({ workspaceId }: { workspaceId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);

  // Tick a counter while pending so the user sees the call is alive.
  useEffect(() => {
    if (!pending || startedAt === null) return;
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - startedAt) / 1000)), 250);
    return () => clearInterval(id);
  }, [pending, startedAt]);

  return (
    <div className="flex flex-col gap-2">
      <Button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            setError(null);
            setSuccess(false);
            setStartedAt(Date.now());
            setElapsed(0);
            const res = await autoDetectBrand(workspaceId);
            if (!res.ok) {
              setError(res.error);
              return;
            }
            setSuccess(true);
            router.refresh();
          })
        }
      >
        {pending ? `Analysing… ${elapsed}s` : 'Auto-detect brand'}
      </Button>
      {pending && (
        <p className="text-xs text-slate-700">
          Gemini 3.1 Pro is reading the screenshot + page text. Typical: 15–30 s.
        </p>
      )}
      {success && (
        <p className="text-sm text-emerald-700">
          Brand detected and saved. Scroll down to review the values.
        </p>
      )}
      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
      <p className="text-xs text-slate-700">
        Costs ≈ $0.01–$0.15 per run depending on knowledge-base size.
      </p>
    </div>
  );
}
