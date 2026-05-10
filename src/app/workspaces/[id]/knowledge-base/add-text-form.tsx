'use client';

import { useRouter } from 'next/navigation';
import { useRef, useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { addKbSourceText } from '@/app/actions/kb';

export function AddKbTextForm({ workspaceId }: { workspaceId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  function onSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const res = await addKbSourceText(workspaceId, {
        title: String(formData.get('title') ?? ''),
        text: String(formData.get('text') ?? ''),
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      formRef.current?.reset();
      router.refresh();
    });
  }

  return (
    <form ref={formRef} action={onSubmit} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="kb-text-title">Title</Label>
        <Input id="kb-text-title" name="title" required maxLength={120} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="kb-text-body">Notes</Label>
        <textarea
          id="kb-text-body"
          name="text"
          required
          maxLength={50_000}
          rows={6}
          className="flex w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          placeholder="Brand voice, product positioning, target audience…"
        />
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? 'Saving…' : 'Add notes'}
        </Button>
        {error && (
          <span className="text-sm text-red-600" role="alert">
            {error}
          </span>
        )}
      </div>
    </form>
  );
}
