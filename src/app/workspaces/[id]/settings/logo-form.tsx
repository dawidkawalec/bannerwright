'use client';

import { useRouter } from 'next/navigation';
import { useRef, useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { removeLogo, uploadLogo } from '@/app/actions/workspaces';

export function LogoForm({
  workspaceId,
  hasLogo,
}: {
  workspaceId: string;
  hasLogo: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  // Cache-bust the logo preview after upload.
  const [version, setVersion] = useState(0);

  function onUpload(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const res = await uploadLogo(workspaceId, formData);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      if (fileRef.current) fileRef.current.value = '';
      setVersion((v) => v + 1);
      router.refresh();
    });
  }

  function onRemove() {
    if (!confirm('Remove logo?')) return;
    setError(null);
    startTransition(async () => {
      const res = await removeLogo(workspaceId);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setVersion((v) => v + 1);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {hasLogo && (
        <div className="flex items-center gap-3 rounded-md border border-slate-200 bg-slate-50 p-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/api/workspaces/${workspaceId}/logo?v=${version}`}
            alt="Workspace logo"
            className="h-12 w-12 rounded-md bg-white object-contain p-1 ring-1 ring-slate-200"
          />
          <Button variant="ghost" size="sm" onClick={onRemove} disabled={pending}>
            Remove
          </Button>
        </div>
      )}

      <form action={onUpload} className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex flex-1 flex-col gap-1.5">
          <Label htmlFor="logo">Upload logo</Label>
          <Input
            ref={fileRef}
            id="logo"
            name="logo"
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            required
            className="cursor-pointer"
          />
          <p className="text-xs text-slate-600">PNG, JPEG, WebP or SVG, up to 2 MB.</p>
        </div>
        <Button type="submit" disabled={pending}>
          {pending ? 'Uploading…' : 'Upload'}
        </Button>
      </form>

      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
