'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ConfirmActionButton } from '@/components/confirm-action-button';
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

  return (
    <ConfirmActionButton
      destructive
      pending={pending}
      title="Delete this banner?"
      description="The banner, its versions, chat history and PNG cache will be removed. The action cannot be undone."
      confirmLabel="Delete banner"
      trigger={
        <Button variant="destructive" size="sm" disabled={pending}>
          {pending ? 'Deleting…' : 'Delete'}
        </Button>
      }
      onConfirm={() =>
        new Promise<void>((resolve) => {
          startTransition(async () => {
            const res = await deleteGeneration(workspaceId, id);
            if (res && !res.ok) {
              toast.error(res.error);
              resolve();
              return;
            }
            toast.success('Banner deleted');
            router.refresh();
            resolve();
          });
        })
      }
    />
  );
}
