'use client';

import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { HelpHint } from '@/components/ui/help-hint';

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
}: {
  chat: ChatRow[];
  onSend: (instruction: string) => void;
  disabled?: boolean;
}) {
  const [text, setText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [chat.length]);

  function submit() {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText('');
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          AI editor
          <HelpHint text='Wpisz po polsku lub angielsku co zmienić w banerze (np. "zmień tło na granatowe"). AI przepisuje cały HTML, każda zmiana tworzy nową wersję — zawsze możesz wrócić do poprzedniej.' />
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div
          ref={scrollRef}
          className="flex max-h-64 flex-col gap-2 overflow-y-auto rounded-md bg-slate-50 p-2 text-sm"
        >
          {chat.length === 0 && (
            <p className="px-2 py-1 text-xs text-slate-700">
              Tell the AI what to change. Each edit creates a new version.
            </p>
          )}
          {chat.map((m) => (
            <div
              key={m.id}
              className={
                m.role === 'user'
                  ? 'self-end rounded-md bg-slate-900 px-3 py-2 text-slate-50'
                  : m.role === 'assistant'
                    ? 'self-start rounded-md bg-white px-3 py-2 text-slate-800 ring-1 ring-slate-200'
                    : 'self-center rounded-md bg-slate-100 px-3 py-1 text-xs text-slate-700'
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
          className="flex w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        />
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-700">⌘⏎ to send</span>
          <Button size="sm" onClick={submit} disabled={disabled || !text.trim()}>
            Send
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
