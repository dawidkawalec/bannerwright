'use client';

import { useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { deleteKbSource, reprocessKbSource } from '@/app/actions/kb';
import type { KbSource } from '@/lib/db/schema';

const STATUS_STYLES: Record<KbSource['status'], string> = {
  pending: 'bg-slate-100 text-slate-700',
  processing: 'bg-blue-100 text-blue-700',
  ready: 'bg-emerald-100 text-emerald-700',
  failed: 'bg-red-100 text-red-700',
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
        <CardTitle className="line-clamp-2 break-all text-sm">
          {source.title}
        </CardTitle>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[source.status]}`}
        >
          {source.status}
        </span>
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
        ) : (
          <div className="flex h-32 items-center justify-center rounded-md border border-dashed border-slate-200 bg-slate-50 text-xs text-slate-500">
            {source.status === 'failed'
              ? source.errorMessage ?? 'Processing failed'
              : 'No screenshot yet'}
          </div>
        )}

        {source.url && (
          <a
            href={source.url}
            target="_blank"
            rel="noreferrer"
            className="truncate text-xs text-slate-500 hover:text-slate-900"
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
                  await reprocessKbSource(workspaceId, source.id);
                  router.refresh();
                })
              }
            >
              {isWorking ? 'Working…' : 'Reprocess'}
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            disabled={pending}
            onClick={() => {
              if (!confirm('Remove this source?')) return;
              startTransition(async () => {
                await deleteKbSource(workspaceId, source.id);
                router.refresh();
              });
            }}
          >
            Remove
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
