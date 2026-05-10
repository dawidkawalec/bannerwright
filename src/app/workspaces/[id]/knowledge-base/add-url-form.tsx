'use client';

import { useRouter } from 'next/navigation';
import { useRef, useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { addKbSourceUrl } from '@/app/actions/kb';

export function AddKbUrlForm({ workspaceId }: { workspaceId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  function onSubmit(formData: FormData) {
    setError(null);
    const url = String(formData.get('url') ?? '');
    startTransition(async () => {
      const res = await addKbSourceUrl(workspaceId, { url });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      formRef.current?.reset();
      router.refresh();
    });
  }

  return (
    <form ref={formRef} action={onSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="flex flex-1 flex-col gap-1.5">
        <Label htmlFor="kb-url">URL</Label>
        <Input
          id="kb-url"
          name="url"
          type="url"
          placeholder="https://example.com"
          required
          autoComplete="off"
        />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? 'Adding…' : 'Add URL'}
      </Button>
      {error && (
        <p className="basis-full text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
