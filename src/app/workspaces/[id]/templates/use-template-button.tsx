'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { duplicateGeneration } from '@/app/actions/generations';

export function UseTemplateButton({
  workspaceId,
  templateId,
}: {
  workspaceId: string;
  templateId: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        size="sm"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            setError(null);
            const res = await duplicateGeneration(workspaceId, templateId);
            if (!res.ok) {
              setError(res.error);
              return;
            }
            router.push(`/workspaces/${workspaceId}/generations/${res.data.id}`);
          })
        }
      >
        {pending ? 'Creating…' : 'Use template'}
      </Button>
      {error && (
        <span className="text-xs text-destructive" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
