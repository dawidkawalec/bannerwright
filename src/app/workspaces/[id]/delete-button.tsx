'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ConfirmActionButton } from '@/components/confirm-action-button';
import { deleteWorkspace } from '@/app/actions/workspaces';

export function DeleteWorkspaceButton({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <ConfirmActionButton
      destructive
      pending={pending}
      title={`Delete "${name}"?`}
      description="This deletes the workspace, its knowledge base, generations and versions. The action cannot be undone."
      confirmLabel="Delete workspace"
      trigger={
        <Button variant="destructive" size="sm" disabled={pending}>
          {pending ? 'Deleting…' : 'Delete workspace'}
        </Button>
      }
      onConfirm={() =>
        new Promise<void>((resolve) => {
          startTransition(async () => {
            const res = await deleteWorkspace(id);
            if (res && !res.ok) {
              toast.error(res.error);
              resolve();
              return;
            }
            toast.success(`Deleted "${name}"`);
            router.refresh();
            resolve();
          });
        })
      }
    />
  );
}
