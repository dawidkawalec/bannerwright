'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { HelpHint } from '@/components/ui/help-hint';
import {
  AttachmentDropzone,
  type Attachment,
} from '@/components/ai/attachment-dropzone';
import { cn } from '@/lib/utils';

export type ChatRow = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
};

export type ChatStage = 'idle' | 'sending' | 'streaming' | 'rendering';

export function ChatPanel({
  chat,
  onSend,
  disabled,
  workspaceId,
  stage = 'idle',
}: {
  chat: ChatRow[];
  onSend: (instruction: string, attachmentKeys: string[]) => void;
  disabled?: boolean;
  workspaceId: string;
  stage?: ChatStage;
}) {
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const isBusy = stage !== 'idle';

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [chat.length, stage]);

  function submit() {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    const keys = attachments.map((a) => a.key);
    onSend(trimmed, keys);
    setText('');
    for (const a of attachments) URL.revokeObjectURL(a.previewUrl);
    setAttachments([]);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          AI editor
          {isBusy && (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
              <Loader2 className="size-3 animate-spin" />
              {stageLabel(stage)}
            </span>
          )}
          <HelpHint text='Wpisz po polsku lub angielsku co zmienić w banerze (np. "zmień tło na granatowe"). Możesz też wkleić / wrzucić obrazek inspiracji. AI przepisuje cały HTML, każda zmiana tworzy nową wersję.' />
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div
          ref={scrollRef}
          className="flex max-h-64 flex-col gap-2 overflow-y-auto rounded-md bg-muted/40 p-2 text-sm"
        >
          {chat.length === 0 && !isBusy && (
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
          {isBusy && <ThinkingBubble stage={stage} />}
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
          placeholder={
            isBusy
              ? 'AI is working — your next message will queue after.'
              : 'e.g. "make the background a deep blue gradient"'
          }
          className={cn(
            'flex w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-50',
            isBusy && 'animate-pulse',
          )}
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
            className={cn(isBusy && 'animate-pulse')}
          >
            {isBusy ? (
              <>
                <Loader2 className="size-3 animate-spin" />
                {stage === 'rendering' ? 'Rendering…' : 'Generating…'}
              </>
            ) : (
              <>
                Send
                {attachments.length > 0 && (
                  <span className="ml-1 rounded bg-primary-foreground/15 px-1 text-[10px] font-semibold">
                    +{attachments.length}
                  </span>
                )}
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ThinkingBubble({ stage }: { stage: ChatStage }) {
  return (
    <div className="self-start flex items-center gap-2 rounded-md bg-card px-3 py-2 ring-1 ring-primary/20">
      <Sparkles className="size-3.5 text-primary animate-pulse" />
      <span className="text-xs font-medium text-foreground">{stageLabel(stage)}</span>
      <span className="inline-flex gap-0.5">
        <span className="size-1.5 rounded-full bg-primary animate-bounce [animation-delay:0ms]" />
        <span className="size-1.5 rounded-full bg-primary animate-bounce [animation-delay:120ms]" />
        <span className="size-1.5 rounded-full bg-primary animate-bounce [animation-delay:240ms]" />
      </span>
    </div>
  );
}

function stageLabel(stage: ChatStage): string {
  switch (stage) {
    case 'sending':
      return 'Sending…';
    case 'streaming':
      return 'Writing HTML…';
    case 'rendering':
      return 'Rendering PNG…';
    default:
      return '';
  }
}
