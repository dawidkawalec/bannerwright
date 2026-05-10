'use client';

import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { HelpHint } from '@/components/ui/help-hint';
import {
  AttachmentDropzone,
  type Attachment,
} from '@/components/ai/attachment-dropzone';

export type ChatRow = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
};

export function ChatPanel({
  chat,
  onSend,
  disabled,
  workspaceId,
}: {
  chat: ChatRow[];
  onSend: (instruction: string, attachmentKeys: string[]) => void;
  disabled?: boolean;
  workspaceId: string;
}) {
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [chat.length]);

  function submit() {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    const keys = attachments.map((a) => a.key);
    onSend(trimmed, keys);
    setText('');
    // Free the previews; the server has the keys now.
    for (const a of attachments) URL.revokeObjectURL(a.previewUrl);
    setAttachments([]);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          AI editor
          <HelpHint text='Wpisz po polsku lub angielsku co zmienić w banerze (np. "zmień tło na granatowe"). Możesz też wkleić / wrzucić obrazek inspiracji. AI przepisuje cały HTML, każda zmiana tworzy nową wersję.' />
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div
          ref={scrollRef}
          className="flex max-h-64 flex-col gap-2 overflow-y-auto rounded-md bg-muted/40 p-2 text-sm"
        >
          {chat.length === 0 && (
            <p className="px-2 py-1 text-xs text-muted-foreground">
              Tell the AI what to change. Drop a screenshot or moodboard for visual cues.
            </p>
          )}
          {chat.map((m) => (
            <div
              key={m.id}
              className={
                m.role === 'user'
                  ? 'self-end rounded-md bg-primary px-3 py-2 text-primary-foreground'
                  : m.role === 'assistant'
                    ? 'self-start rounded-md bg-card px-3 py-2 text-foreground ring-1 ring-border'
                    : 'self-center rounded-md bg-muted px-3 py-1 text-xs text-muted-foreground'
              }
            >
              {m.content}
            </div>
          ))}
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
              e.preventDefault();
              submit();
            }
          }}
          rows={3}
          maxLength={2_000}
          disabled={disabled}
          placeholder='e.g. "make the background a deep blue gradient"'
          className="flex w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-50"
        />
        <AttachmentDropzone
          workspaceId={workspaceId}
          attachments={attachments}
          onChange={setAttachments}
          disabled={disabled}
          compact
        />
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">⌘⏎ to send</span>
          <Button
            size="sm"
            onClick={submit}
            disabled={disabled || !text.trim()}
          >
            Send
            {attachments.length > 0 && (
              <span className="ml-1 rounded bg-primary-foreground/15 px-1 text-[10px] font-semibold">
                +{attachments.length}
              </span>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
