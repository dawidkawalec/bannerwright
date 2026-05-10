'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { BannerPreview } from '@/components/banner-preview';
import { MonacoHtmlEditor } from './monaco-editor';
import { ChatPanel, type ChatRow } from './chat-panel';
import { VersionsPanel, type VersionRow } from './versions-panel';
import { BackgroundButton } from './background-button';
import {
  restoreVersion,
  saveManualEdit,
} from '@/app/actions/generations';
import type { GenerationFormat } from '@/lib/db/schema';

const PREVIEW_DEBOUNCE_MS = 500;
const STREAM_DEBOUNCE_MS = 200;

export type EditorShellProps = {
  workspaceId: string;
  generationId: string;
  format: GenerationFormat;
  initialHtml: string;
  initialChat: ChatRow[];
  initialVersions: VersionRow[];
};

type Status =
  | { kind: 'idle' }
  | { kind: 'saving' }
  | { kind: 'streaming' }
  | { kind: 'rendering' }
  | { kind: 'restoring' }
  | { kind: 'error'; message: string }
  | { kind: 'ok'; message: string };

export function EditorShell({
  workspaceId,
  generationId,
  format,
  initialHtml,
  initialChat,
  initialVersions,
}: EditorShellProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [savedHtml, setSavedHtml] = useState(initialHtml);
  const [editorHtml, setEditorHtml] = useState(initialHtml);
  const [previewHtml, setPreviewHtml] = useState(initialHtml);
  const [chat, setChat] = useState<ChatRow[]>(initialChat);
  const [versions, setVersions] = useState<VersionRow[]>(initialVersions);
  const [status, setStatus] = useState<Status>({ kind: 'idle' });

  const previewTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce iframe re-render for manual edits.
  useEffect(() => {
    if (status.kind === 'streaming') return; // streaming path drives previewHtml directly
    if (previewTimer.current) clearTimeout(previewTimer.current);
    previewTimer.current = setTimeout(() => {
      setPreviewHtml(editorHtml);
    }, PREVIEW_DEBOUNCE_MS);
    return () => {
      if (previewTimer.current) clearTimeout(previewTimer.current);
    };
  }, [editorHtml, status.kind]);

  const isDirty = editorHtml !== savedHtml;
  const isWorking =
    status.kind === 'saving' ||
    status.kind === 'streaming' ||
    status.kind === 'rendering' ||
    status.kind === 'restoring';

  async function onManualSave() {
    if (!isDirty || isWorking) return;
    setStatus({ kind: 'saving' });
    const res = await saveManualEdit(workspaceId, generationId, editorHtml);
    if (!res.ok) {
      setStatus({ kind: 'error', message: res.error });
      return;
    }
    setSavedHtml(editorHtml);
    setStatus({ kind: 'ok', message: `Saved as v${res.data.versionNumber}` });
    startTransition(() => router.refresh());
  }

  async function onChatSend(instruction: string) {
    setStatus({ kind: 'streaming' });
    setChat((prev) => [
      ...prev,
      { id: `local-${Date.now()}`, role: 'user', content: instruction, createdAt: new Date().toISOString() },
    ]);

    let lastEmit = 0;
    const res = await fetch(`/api/generations/${generationId}/edit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ instruction }),
    });

    if (!res.ok || !res.body) {
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      setStatus({ kind: 'error', message: body.error ?? `HTTP ${res.status}` });
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let streamingHtml = '';

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let nl: number;
      while ((nl = buffer.indexOf('\n\n')) !== -1) {
        const raw = buffer.slice(0, nl);
        buffer = buffer.slice(nl + 2);
        if (!raw.startsWith('data: ')) continue;
        const event = parse(raw.slice(6));
        if (!event) continue;

        if (event.type === 'partial_html') {
          streamingHtml = event.html;
          const now = Date.now();
          if (now - lastEmit > STREAM_DEBOUNCE_MS) {
            setPreviewHtml(streamingHtml);
            lastEmit = now;
          }
        } else if (event.type === 'progress') {
          if (event.step === 'rendering_png') setStatus({ kind: 'rendering' });
        } else if (event.type === 'done') {
          setSavedHtml(event.htmlFinal);
          setEditorHtml(event.htmlFinal);
          setPreviewHtml(event.htmlFinal);
          setVersions((prev) => [
            {
              id: event.versionId,
              versionNumber: event.versionNumber,
              triggeredBy: 'ai_edit',
              createdAt: new Date().toISOString(),
            },
            ...prev,
          ]);
          setChat((prev) => [
            ...prev,
            {
              id: `local-${Date.now()}-a`,
              role: 'assistant',
              content: `Updated to v${event.versionNumber}.`,
              createdAt: new Date().toISOString(),
            },
          ]);
          setStatus({
            kind: 'ok',
            message: `v${event.versionNumber} · $${event.costUsd.toFixed(4)}`,
          });
          startTransition(() => router.refresh());
        } else if (event.type === 'error') {
          setStatus({ kind: 'error', message: event.message });
        }
      }
    }
  }

  async function onRestore(versionId: string) {
    setStatus({ kind: 'restoring' });
    const res = await restoreVersion(workspaceId, generationId, versionId);
    if (!res.ok) {
      setStatus({ kind: 'error', message: res.error });
      return;
    }
    startTransition(() => router.refresh());
    setStatus({ kind: 'ok', message: `Restored as v${res.data.versionNumber}` });
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_320px] lg:h-[calc(100vh-180px)]">
      <div className="flex min-h-[400px] flex-col overflow-hidden rounded-lg border border-slate-200 bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-800 px-3 py-2 text-xs text-slate-300">
          <span>HTML {isDirty && <em className="not-italic text-amber-400">· unsaved</em>}</span>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-slate-200 hover:bg-slate-800 hover:text-white"
              onClick={onManualSave}
              disabled={!isDirty || isWorking}
            >
              {status.kind === 'saving' ? 'Saving…' : 'Save (⌘S)'}
            </Button>
          </div>
        </div>
        <MonacoHtmlEditor
          value={editorHtml}
          onChange={setEditorHtml}
          onSave={onManualSave}
          className="flex-1"
        />
      </div>

      <div className="flex min-h-[400px] flex-col gap-2">
        <div className="flex items-center justify-between text-xs uppercase tracking-wide text-slate-600">
          <span>Live preview</span>
          <a
            href={`/api/generations/${generationId}/png`}
            download
            className="text-slate-700 underline hover:text-slate-900"
          >
            Download PNG
          </a>
        </div>
        <BannerPreview html={previewHtml} format={format} className="flex-1" />
        <StatusLine status={status} />
      </div>

      <div className="flex flex-col gap-4">
        <ChatPanel chat={chat} onSend={onChatSend} disabled={isWorking} />
        <BackgroundButton
          workspaceId={workspaceId}
          generationId={generationId}
          disabled={isWorking}
        />
        <VersionsPanel versions={versions} onRestore={onRestore} disabled={isWorking} />
      </div>
    </div>
  );
}

function StatusLine({ status }: { status: Status }) {
  if (status.kind === 'idle') return null;
  const tone =
    status.kind === 'error'
      ? 'text-red-600'
      : status.kind === 'ok'
        ? 'text-emerald-600'
        : 'text-slate-600';
  const text =
    status.kind === 'error'
      ? status.message
      : status.kind === 'ok'
        ? status.message
        : status.kind === 'saving'
          ? 'Saving…'
          : status.kind === 'streaming'
            ? 'AI is rewriting HTML…'
            : status.kind === 'rendering'
              ? 'Rendering PNG…'
              : 'Restoring…';
  return <p className={`text-xs ${tone}`}>{text}</p>;
}

type StreamEvent =
  | { type: 'progress'; step: 'preparing' | 'generating_html' | 'rendering_png' }
  | { type: 'partial_html'; html: string }
  | {
      type: 'done';
      versionId: string;
      versionNumber: number;
      htmlFinal: string;
      pngUrl: string;
      tokens: { input: number; output: number };
      costUsd: number;
    }
  | { type: 'error'; message: string };

function parse(s: string): StreamEvent | null {
  try {
    return JSON.parse(s) as StreamEvent;
  } catch {
    return null;
  }
}
