'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { deleteGeneration } from '@/app/actions/generations';

export function DeleteGenerationButton({
  workspaceId,
  id,
}: {
  workspaceId: string;
  id: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        variant="destructive"
        size="sm"
        disabled={pending}
        onClick={() => {
          if (!confirm('Delete this banner? This cannot be undone.')) return;
          setError(null);
          startTransition(async () => {
            const res = await deleteGeneration(workspaceId, id);
            if (res && !res.ok) {
              setError(res.error);
              return;
            }
            router.refresh();
          });
        }}
      >
        {pending ? 'Deleting…' : 'Delete'}
      </Button>
      {error && (
        <span className="text-xs text-red-600" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
