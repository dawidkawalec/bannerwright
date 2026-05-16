'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { deleteGeneratedAsset } from '@/app/actions/workspaces';
import { toast } from 'sonner';

export function AssetCard({
  workspaceId,
  name,
  size,
  createdAt,
}: {
  workspaceId: string;
  name: string;
  size: number;
  createdAt: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);

  function onDelete() {
    if (!confirm(`Delete ${name}? This cannot be undone.`)) return;
    startTransition(async () => {
      const res = await deleteGeneratedAsset(workspaceId, name);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success('Deleted');
      router.refresh();
    });
  }

  async function copyName() {
    try {
      await navigator.clipboard.writeText(name);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      toast.error('Could not copy');
    }
  }

  const sizeKb = (size / 1024).toFixed(0);
  // toLocaleString() output depends on the client's locale/timezone, which
  // differs from SSR — render only after mount to avoid hydration mismatch.
  const [date, setDate] = useState<string>('');
  useEffect(() => {
    setDate(new Date(createdAt).toLocaleString());
  }, [createdAt]);

  return (
    <div className="group flex flex-col overflow-hidden rounded-lg border border-border bg-card">
      <a
        href={`/api/workspaces/${workspaceId}/assets/${name}`}
        target="_blank"
        rel="noreferrer"
        className="relative block aspect-square overflow-hidden bg-muted"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/api/workspaces/${workspaceId}/assets/${name}`}
          alt={name}
          className="h-full w-full object-cover transition-transform group-hover:scale-105"
          loading="lazy"
        />
      </a>
      <div className="flex flex-col gap-1 p-3">
        <p className="truncate text-xs font-medium text-foreground" title={name}>
          {name}
        </p>
        <p className="text-[10px] text-muted-foreground">
          {sizeKb} KB · {date}
        </p>
        <div className="mt-2 flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2"
            onClick={copyName}
            title="Copy filename"
          >
            {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-destructive hover:text-destructive"
            onClick={onDelete}
            disabled={pending}
            title="Delete asset"
          >
            <Trash2 className="size-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}
