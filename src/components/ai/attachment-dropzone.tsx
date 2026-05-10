'use client';

import { useCallback, useEffect, useRef, useState, type DragEvent } from 'react';
import { ImagePlus, Loader2, Paperclip, X } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export type Attachment = {
  /** Server-assigned storage key. */
  key: string;
  mimeType: string;
  size: number;
  /** Local preview URL (object URL) — revoked when removed. */
  previewUrl: string;
  /** Original filename for display. */
  name: string;
};

const ALLOWED_MIME = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
const MAX_FILES = 5;
const MAX_BYTES = 5 * 1024 * 1024;

type Props = {
  workspaceId: string;
  attachments: Attachment[];
  onChange: (next: Attachment[]) => void;
  disabled?: boolean;
  /** Compact variant for inline use inside the chat panel. */
  compact?: boolean;
  /** Optional copy shown above the dropzone in non-compact mode. */
  helper?: string;
};

export function AttachmentDropzone({
  workspaceId,
  attachments,
  onChange,
  disabled,
  compact,
  helper = 'Drag images here, paste from clipboard, or click to attach. Up to 5 (PNG / JPEG / WebP / GIF, ≤ 5 MB each).',
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  // Revoke object URLs on unmount to avoid leaking memory.
  useEffect(() => {
    return () => {
      for (const a of attachments) URL.revokeObjectURL(a.previewUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const upload = useCallback(
    async (files: File[]) => {
      if (files.length === 0) return;
      const remaining = MAX_FILES - attachments.length;
      if (remaining <= 0) {
        toast.error(`Max ${MAX_FILES} attachments`);
        return;
      }

      const accepted: File[] = [];
      for (const f of files.slice(0, remaining)) {
        if (!ALLOWED_MIME.includes(f.type)) {
          toast.error(`Unsupported type: ${f.name}`);
          continue;
        }
        if (f.size > MAX_BYTES) {
          toast.error(`Too large: ${f.name} (max 5 MB)`);
          continue;
        }
        accepted.push(f);
      }
      if (accepted.length === 0) return;

      setUploading(true);
      try {
        const form = new FormData();
        for (const f of accepted) form.append('files', f, f.name);
        const res = await fetch(`/api/workspaces/${workspaceId}/attachments`, {
          method: 'POST',
          body: form,
        });
        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(body.error ?? `HTTP ${res.status}`);
        }
        const json = (await res.json()) as {
          attachments: { key: string; mimeType: string; size: number }[];
        };
        const next: Attachment[] = json.attachments.map((a, i) => ({
          ...a,
          previewUrl: URL.createObjectURL(accepted[i]!),
          name: accepted[i]!.name,
        }));
        onChange([...attachments, ...next]);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Upload failed');
      } finally {
        setUploading(false);
      }
    },
    [attachments, onChange, workspaceId],
  );

  function remove(idx: number) {
    const a = attachments[idx];
    if (!a) return;
    URL.revokeObjectURL(a.previewUrl);
    onChange(attachments.filter((_, i) => i !== idx));
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    if (disabled || uploading) return;
    const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith('image/'));
    void upload(files);
  }

  function onPaste(e: React.ClipboardEvent<HTMLDivElement>) {
    if (disabled || uploading) return;
    const items = Array.from(e.clipboardData.items);
    const files: File[] = [];
    for (const it of items) {
      if (it.kind === 'file') {
        const f = it.getAsFile();
        if (f && f.type.startsWith('image/')) files.push(f);
      }
    }
    if (files.length === 0) return;
    e.preventDefault();
    void upload(files);
  }

  return (
    <div className={cn('flex flex-col gap-2', !compact && 'rounded-md border border-dashed border-border bg-muted/20 p-3')}
      onPaste={onPaste}
    >
      {!compact && helper && (
        <p className="text-[11px] text-muted-foreground">{helper}</p>
      )}

      {/* Tile row + dropzone target */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={cn(
          'flex flex-wrap items-center gap-2 rounded-md transition-colors',
          dragOver && 'ring-2 ring-primary/50',
        )}
      >
        {attachments.map((a, i) => (
          <div
            key={a.key}
            className="relative size-14 shrink-0 overflow-hidden rounded-md ring-1 ring-border"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={a.previewUrl} alt={a.name} className="size-full object-cover" />
            <button
              type="button"
              onClick={() => remove(i)}
              disabled={disabled}
              className="absolute right-0.5 top-0.5 grid size-4 place-items-center rounded-full bg-background/85 text-foreground shadow ring-1 ring-border transition hover:bg-background"
              aria-label={`Remove ${a.name}`}
            >
              <X className="size-2.5" />
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={disabled || uploading || attachments.length >= MAX_FILES}
          className={cn(
            'flex items-center gap-1.5 rounded-md border border-dashed border-border bg-background px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50',
            compact ? 'h-7 text-[11px]' : 'h-8',
          )}
        >
          {uploading ? (
            <>
              <Loader2 className="size-3.5 animate-spin" />
              Uploading…
            </>
          ) : compact ? (
            <>
              <Paperclip className="size-3.5" />
              {attachments.length === 0 ? 'Attach image' : 'Add another'}
            </>
          ) : (
            <>
              <ImagePlus className="size-3.5" />
              {attachments.length === 0 ? 'Add inspiration' : `Add another (${MAX_FILES - attachments.length} left)`}
            </>
          )}
        </button>

        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          multiple
          hidden
          onChange={(e) => {
            const files = Array.from(e.target.files ?? []);
            if (files.length > 0) void upload(files);
            e.target.value = '';
          }}
        />
      </div>
    </div>
  );
}
