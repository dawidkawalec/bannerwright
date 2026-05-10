'use client';

import { useRouter } from 'next/navigation';
import { useRef, useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { addKbSourceUpload } from '@/app/actions/kb';

export function AddKbUploadForm({ workspaceId }: { workspaceId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  function onSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const res = await addKbSourceUpload(workspaceId, formData);
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
        <Label htmlFor="kb-file">File</Label>
        <Input
          id="kb-file"
          name="file"
          type="file"
          required
          accept=".txt,.md,.markdown,text/plain,text/markdown,image/png,image/jpeg,image/webp"
          className="cursor-pointer"
        />
        <p className="text-xs text-slate-600">
          TXT, MD, PNG, JPEG, WebP — up to 10 MB. PDF coming soon.
        </p>
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? 'Uploading…' : 'Upload'}
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
