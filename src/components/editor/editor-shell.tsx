'use client';

import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { BannerPreview } from '@/components/banner-preview';
import { ChatPanel, type ChatRow, type ChatStage } from './chat-panel';
import { VersionsPanel, type VersionRow } from './versions-panel';
import { BackgroundButton } from './background-button';
import { VisualCanvas } from './visual/visual-canvas';
import { PropertiesPanel } from './visual/properties-panel';
import { restoreVersion, saveVisualEdit } from '@/app/actions/generations';
import type { GenerationFormat } from '@/lib/db/schema';
import { stampHtml } from '@/lib/wysiwyg/stamp';
import { applyOps, type VisualOp } from '@/lib/wysiwyg/patch';

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

type Mode = 'visual' | 'chat';

type Status =
  | { kind: 'idle' }
  | { kind: 'saving' }
  | { kind: 'sending' }
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

  const [mode, setMode] = useState<Mode>('visual');
  const [, setSavedHtml] = useState(initialHtml);
  const [editorHtml, setEditorHtml] = useState(initialHtml);
  const [previewHtml, setPreviewHtml] = useState(initialHtml);
  const [chat, setChat] = useState<ChatRow[]>(initialChat);
  const [versions, setVersions] = useState<VersionRow[]>(initialVersions);
  const [status, setStatus] = useState<Status>({ kind: 'idle' });

  // Visual mode state
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [canvasRefreshKey, setCanvasRefreshKey] = useState(0);
  const [shadow, setShadow] = useState<ShadowRoot | null>(null);

  const previewTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Stamp HTML the first time we enter Visual mode (idempotent — won't change
  // existing IDs). Stamping changes the HTML in memory; it's persisted only
  // when the user actually applies a visual edit.
  const stampedHtml = useMemo(() => {
    if (typeof window === 'undefined') return editorHtml;
    if (mode !== 'visual') return editorHtml;
    try {
      return stampHtml(editorHtml);
    } catch {
      return editorHtml;
    }
  }, [mode, editorHtml]);

  // Debounce iframe re-render for manual edits.
  useEffect(() => {
    if (status.kind === 'streaming') return;
    if (previewTimer.current) clearTimeout(previewTimer.current);
    previewTimer.current = setTimeout(() => {
      setPreviewHtml(editorHtml);
    }, PREVIEW_DEBOUNCE_MS);
    return () => {
      if (previewTimer.current) clearTimeout(previewTimer.current);
    };
  }, [editorHtml, status.kind]);

  const isWorking =
    status.kind === 'saving' ||
    status.kind === 'sending' ||
    status.kind === 'streaming' ||
    status.kind === 'rendering' ||
    status.kind === 'restoring';

  const chatStage: ChatStage =
    status.kind === 'sending'
      ? 'sending'
      : status.kind === 'streaming'
        ? 'streaming'
        : status.kind === 'rendering'
          ? 'rendering'
          : 'idle';

  const previewBusy = chatStage !== 'idle';
  const previewLabel =
    chatStage === 'sending'
      ? 'Asking AI…'
      : chatStage === 'streaming'
        ? 'AI is writing HTML…'
        : chatStage === 'rendering'
          ? 'Rendering PNG…'
          : '';

  async function onVisualApply(ops: VisualOp[]) {
    if (ops.length === 0 || isWorking) return;
    setStatus({ kind: 'saving' });
    const next = applyOps(stampedHtml, ops);
    setEditorHtml(next);
    setPreviewHtml(next);
    setCanvasRefreshKey((k) => k + 1);
    const res = await saveVisualEdit(workspaceId, generationId, next);
    if (!res.ok) {
      setStatus({ kind: 'error', message: res.error });
      toast.error(res.error);
      return;
    }
    setSavedHtml(next);
    setVersions((prev) => [
      {
        id: res.data.versionId,
        versionNumber: res.data.versionNumber,
        triggeredBy: 'visual_edit',
        createdAt: new Date().toISOString(),
      },
      ...prev,
    ]);
    setStatus({ kind: 'ok', message: `Saved as v${res.data.versionNumber}` });
    toast.success(`Saved as v${res.data.versionNumber}`);
    setSelectedId(null);
    startTransition(() => router.refresh());
  }

  async function onChatSend(instruction: string, attachmentKeys: string[] = []) {
    setStatus({ kind: 'sending' });
    setChat((prev) => [
      ...prev,
      {
        id: `local-${Date.now()}`,
        role: 'user',
        content:
          attachmentKeys.length > 0
            ? `${instruction}\n[+${attachmentKeys.length} image${attachmentKeys.length === 1 ? '' : 's'}]`
            : instruction,
        createdAt: new Date().toISOString(),
      },
    ]);

    let lastEmit = 0;
    const res = await fetch(`/api/generations/${generationId}/edit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        instruction,
        attachmentKeys: attachmentKeys.length > 0 ? attachmentKeys : undefined,
      }),
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
          // Promote to streaming the moment we have first bytes
          setStatus((prev) => (prev.kind === 'streaming' ? prev : { kind: 'streaming' }));
          const now = Date.now();
          if (now - lastEmit > STREAM_DEBOUNCE_MS) {
            setPreviewHtml(streamingHtml);
            lastEmit = now;
          }
        } else if (event.type === 'progress') {
          if (event.step === 'generating_html') setStatus({ kind: 'streaming' });
          else if (event.step === 'rendering_png') setStatus({ kind: 'rendering' });
        } else if (event.type === 'done') {
          setSavedHtml(event.htmlFinal);
          setEditorHtml(event.htmlFinal);
          setPreviewHtml(event.htmlFinal);
          setSelectedId(null);
          setCanvasRefreshKey((k) => k + 1);
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
      toast.error(res.error);
      return;
    }
    startTransition(() => router.refresh());
    setStatus({ kind: 'ok', message: `Restored as v${res.data.versionNumber}` });
    toast.success(`Restored as v${res.data.versionNumber}`);
  }

  // Look up the currently-selected element in the live shadow tree. Depend on
  // canvasRefreshKey so a fresh element ref is read after the canvas re-renders.
  const selectedElement = useMemo<HTMLElement | null>(() => {
    if (!selectedId || !shadow) return null;
    return shadow.querySelector(
      `[data-bw-id="${cssEscape(selectedId)}"]`,
    ) as HTMLElement | null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, shadow, canvasRefreshKey]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <ModeTabs mode={mode} onChange={setMode} disabled={isWorking} />
        <GlobalStatusPill status={status} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_340px] lg:h-[calc(100vh-220px)]">
        {mode === 'visual' && (
          <>
            <div className="flex min-h-[400px] flex-col gap-2 lg:col-span-1">
              <div className="flex items-center justify-between text-xs uppercase tracking-wide text-muted-foreground">
                <span title="Klikaj elementy banera (nagłówek, przycisk, obrazek), żeby je edytować po prawej. Każda zmiana to nowa wersja w historii.">
                  Banner — click to edit
                </span>
                <a
                  href={`/api/generations/${generationId}/png`}
                  download
                  className="text-muted-foreground underline hover:text-foreground"
                  title="Pobierz aktualną wersję jako PNG."
                >
                  Download PNG
                </a>
              </div>
              <VisualCanvas
                html={stampedHtml}
                format={format}
                selectedId={selectedId}
                onSelect={setSelectedId}
                refreshKey={canvasRefreshKey}
                onShadowReady={(s) => setShadow(s)}
                className="flex-1"
                busy={previewBusy}
                busyLabel={previewLabel}
              />
              <StatusLine status={status} />
            </div>
            <div className="flex flex-col gap-4 lg:col-span-1">
              <PropertiesPanel
                key={selectedId ?? 'none'}
                selectedElement={selectedElement}
                selectedId={selectedId}
                onApply={onVisualApply}
                onCancel={() => setSelectedId(null)}
                disabled={isWorking}
              />
            </div>
          </>
        )}

        {mode === 'chat' && (
          <div className="flex min-h-[400px] flex-col gap-2 lg:col-span-2">
            <div className="flex items-center justify-between text-xs uppercase tracking-wide text-muted-foreground">
              <span>Banner preview</span>
              <a
                href={`/api/generations/${generationId}/png`}
                download
                className="text-muted-foreground underline hover:text-foreground"
              >
                Download PNG
              </a>
            </div>
            <BannerPreview html={previewHtml} format={format} className="flex-1" />
            <StatusLine status={status} />
          </div>
        )}

        <div className="flex flex-col gap-4">
          <ChatPanel
            chat={chat}
            onSend={onChatSend}
            disabled={isWorking}
            workspaceId={workspaceId}
            stage={chatStage}
          />
          <BackgroundButton
            workspaceId={workspaceId}
            generationId={generationId}
            disabled={isWorking}
          />
          <VersionsPanel versions={versions} onRestore={onRestore} disabled={isWorking} />
        </div>
      </div>
    </div>
  );
}

function ModeTabs({
  mode,
  onChange,
  disabled,
}: {
  mode: Mode;
  onChange: (m: Mode) => void;
  disabled?: boolean;
}) {
  const tabs: Array<{ id: Mode; label: string; help: string }> = [
    {
      id: 'visual',
      label: 'Visual',
      help: 'Klikaj elementy banera i edytuj tekst/kolory/fonty bez kodu.',
    },
    {
      id: 'chat',
      label: 'Chat',
      help: 'Powiedz AI co zmienić w naturalnym języku — pełen rewrite HTML.',
    },
  ];
  return (
    <Tabs value={mode} onValueChange={(v) => onChange(v as Mode)} className="self-start">
      <TabsList>
        {tabs.map((t) => (
          <Tooltip key={t.id}>
            <TooltipTrigger asChild>
              <TabsTrigger value={t.id} disabled={disabled}>
                {t.label}
              </TabsTrigger>
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-xs">{t.help}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </TabsList>
    </Tabs>
  );
}

function StatusLine({ status }: { status: Status }) {
  if (status.kind === 'idle') return null;
  const tone =
    status.kind === 'error'
      ? 'text-destructive'
      : status.kind === 'ok'
        ? 'text-emerald-400'
        : 'text-muted-foreground';
  const text =
    status.kind === 'error'
      ? status.message
      : status.kind === 'ok'
        ? status.message
        : status.kind === 'saving'
          ? 'Saving…'
          : status.kind === 'sending'
            ? 'Asking AI…'
            : status.kind === 'streaming'
              ? 'AI is rewriting HTML…'
              : status.kind === 'rendering'
                ? 'Rendering PNG…'
                : 'Restoring…';
  return <p className={`text-xs ${tone}`}>{text}</p>;
}

/**
 * Persistent status badge shown next to the mode tabs. Stays out of `idle`
 * so the user always sees what the editor is doing — sending, streaming,
 * rendering, saving, success, error.
 */
function GlobalStatusPill({ status }: { status: Status }) {
  if (status.kind === 'idle') return null;
  const busy =
    status.kind === 'sending' ||
    status.kind === 'streaming' ||
    status.kind === 'rendering' ||
    status.kind === 'saving' ||
    status.kind === 'restoring';
  const label =
    status.kind === 'sending'
      ? 'Asking AI…'
      : status.kind === 'streaming'
        ? 'AI is writing HTML…'
        : status.kind === 'rendering'
          ? 'Rendering PNG…'
          : status.kind === 'saving'
            ? 'Saving…'
            : status.kind === 'restoring'
              ? 'Restoring…'
              : status.kind === 'ok'
                ? status.message
                : status.message;

  const tone =
    status.kind === 'error'
      ? 'border-destructive/40 bg-destructive/10 text-destructive'
      : status.kind === 'ok'
        ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
        : 'border-primary/40 bg-primary/10 text-primary';

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium shadow-sm ${tone} ${
        busy ? 'animate-pulse' : ''
      }`}
      role="status"
      aria-live="polite"
    >
      {busy ? (
        <Loader2 className="size-3 animate-spin" />
      ) : status.kind === 'error' ? (
        <XCircle className="size-3.5" />
      ) : (
        <CheckCircle2 className="size-3.5" />
      )}
      {label}
    </div>
  );
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

function cssEscape(s: string): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const css = (globalThis as any).CSS;
  if (css && typeof css.escape === 'function') return css.escape(s);
  return s.replace(/[^\w-]/g, (c) => `\\${c}`);
}
