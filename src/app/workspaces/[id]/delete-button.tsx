'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { deleteWorkspace } from '@/app/actions/workspaces';

export function DeleteWorkspaceButton({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onClick() {
    if (!confirm(`Delete workspace "${name}"? This cannot be undone.`)) return;
    setError(null);
    startTransition(async () => {
      const res = await deleteWorkspace(id);
      // deleteWorkspace redirects on success — only get a result on error
      if (res && !res.ok) {
        setError(res.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button variant="destructive" size="sm" onClick={onClick} disabled={pending}>
        {pending ? 'Deleting…' : 'Delete workspace'}
      </Button>
      {error && (
        <p className="text-xs text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
