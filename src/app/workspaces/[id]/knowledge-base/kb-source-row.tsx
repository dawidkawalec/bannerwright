'use client';

import { useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ConfirmActionButton } from '@/components/confirm-action-button';
import { deleteKbSource, reprocessKbSource } from '@/app/actions/kb';
import type { KbSource } from '@/lib/db/schema';

const STATUS_VARIANTS: Record<
  KbSource['status'],
  'default' | 'secondary' | 'destructive' | 'outline'
> = {
  pending: 'outline',
  processing: 'secondary',
  ready: 'default',
  failed: 'destructive',
};

const STATUS_LABELS: Record<KbSource['status'], string> = {
  pending: 'Pending',
  processing: 'Processing',
  ready: 'Ready',
  failed: 'Failed',
};

export function KbSourceRow({
  source,
  workspaceId,
}: {
  source: KbSource;
  workspaceId: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const isWorking = source.status === 'pending' || source.status === 'processing';

  // Poll while processing (cheap — one query per workspace per few seconds).
  useEffect(() => {
    if (!isWorking) return;
    const interval = setInterval(() => router.refresh(), 3000);
    return () => clearInterval(interval);
  }, [isWorking, router]);

  return (
    <Card className="flex flex-col">
      <CardHeader className="flex-row items-start justify-between gap-2">
        <CardTitle className="line-clamp-2 break-all text-sm">{source.title}</CardTitle>
        <Badge variant={STATUS_VARIANTS[source.status]}>{STATUS_LABELS[source.status]}</Badge>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3">
        {source.screenshotPath ? (
          <a
            href={`/api/kb/${source.id}/screenshot`}
            target="_blank"
            rel="noreferrer"
            className="block overflow-hidden rounded-md border border-slate-200"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/kb/${source.id}/screenshot`}
              alt={source.title}
              className="h-32 w-full object-cover object-top"
            />
          </a>
        ) : source.contentText ? (
          <div className="line-clamp-6 rounded-md bg-slate-50 p-3 text-xs whitespace-pre-wrap text-slate-700">
            {source.contentText}
          </div>
        ) : (
          <div className="flex h-32 items-center justify-center rounded-md border border-dashed border-slate-200 bg-slate-50 px-3 text-center text-xs text-slate-700">
            {source.status === 'failed'
              ? source.errorMessage ?? 'Processing failed'
              : source.sourceType === 'url'
                ? 'No screenshot yet'
                : 'No preview available'}
          </div>
        )}

        {source.url && (
          <a
            href={source.url}
            target="_blank"
            rel="noreferrer"
            className="truncate text-xs text-slate-700 hover:text-slate-900"
          >
            {source.url}
          </a>
        )}

        <div className="mt-auto flex gap-2 pt-2">
          {source.sourceType === 'url' && (
            <Button
              variant="outline"
              size="sm"
              disabled={pending || isWorking}
              onClick={() =>
                startTransition(async () => {
                  const res = await reprocessKbSource(workspaceId, source.id);
                  if (res && !res.ok) toast.error(res.error);
                  else toast.info('Reprocessing started');
                  router.refresh();
                })
              }
            >
              {isWorking ? 'Working…' : 'Reprocess'}
            </Button>
          )}
          <ConfirmActionButton
            destructive
            pending={pending}
            title="Remove this source?"
            description={`"${source.title}" will be removed from the knowledge base. The action cannot be undone.`}
            confirmLabel="Remove"
            trigger={
              <Button variant="ghost" size="sm" disabled={pending}>
                Remove
              </Button>
            }
            onConfirm={() =>
              new Promise<void>((resolve) => {
                startTransition(async () => {
                  const res = await deleteKbSource(workspaceId, source.id);
                  if (res && !res.ok) toast.error(res.error);
                  else toast.success('Source removed');
                  router.refresh();
                  resolve();
                });
              })
            }
          />
        </div>
      </CardContent>
    </Card>
  );
}
