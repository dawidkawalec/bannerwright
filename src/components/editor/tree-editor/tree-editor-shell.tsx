'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from 'zustand';
import { CheckCircle2, Loader2, Redo2, Undo2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { restoreVersion, saveTreeEdit } from '@/app/actions/generations';
import { createEditorStore } from '@/lib/tree/store';
import { bannerTreeSchema } from '@/lib/tree/schema';
import type { BannerTree } from '@/lib/tree/types';
import { BackgroundButton } from '../background-button';
import { ChatPanel, type ChatRow, type ChatStage } from '../chat-panel';
import { VersionsPanel, type VersionRow } from '../versions-panel';
import { TreeCanvas } from './canvas';
import { LayersPanel } from './layers-panel';
import { Inspector } from './inspector';

const AUTOSAVE_DEBOUNCE_MS = 800;

export type TreeEditorShellProps = {
  workspaceId: string;
  generationId: string;
  initialTree: BannerTree;
  initialChat: ChatRow[];
  versions: VersionRow[];
};

type SaveStatus =
  | { kind: 'idle' }
  | { kind: 'saving' }
  | { kind: 'saved' }
  | { kind: 'error'; message: string };

export function TreeEditorShell({
  workspaceId,
  generationId,
  initialTree,
  initialChat,
  versions,
}: TreeEditorShellProps) {
  const router = useRouter();
  // Create the store once per editor instance. useState lazy init is the
  // canonical pattern; using useRef trips React 19's strict ref-during-render
  // rule.
  const [store] = useState(() => createEditorStore(initialTree));

  const tree = useStore(store, (s) => s.tree);
  const selection = useStore(store, (s) => s.selection);
  const hover = useStore(store, (s) => s.hover);
  const dirty = useStore(store, (s) => s.dirty);
  const setSelection = useStore(store, (s) => s.setSelection);
  const setHover = useStore(store, (s) => s.setHover);
  const patchNode = useStore(store, (s) => s.patchNode);
  const moveSelectedBy = useStore(store, (s) => s.moveSelectedBy);
  const markClean = useStore(store, (s) => s.markClean);

  const [status, setStatus] = useState<SaveStatus>({ kind: 'idle' });
  const [chat, setChat] = useState<ChatRow[]>(initialChat);
  const [chatStage, setChatStage] = useState<ChatStage>('idle');
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setTree = useStore(store, (s) => s.setTree);

  // Debounced autosave on dirty.
  useEffect(() => {
    if (!dirty) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      setStatus({ kind: 'saving' });
      const currentTree = store.getState().tree;
      const res = await saveTreeEdit(workspaceId, generationId, currentTree);
      if (res.ok) {
        markClean();
        setStatus({ kind: 'saved' });
        setTimeout(() => setStatus((s) => (s.kind === 'saved' ? { kind: 'idle' } : s)), 1500);
      } else {
        setStatus({ kind: 'error', message: res.error });
        toast.error(res.error);
      }
    }, AUTOSAVE_DEBOUNCE_MS);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [dirty, workspaceId, generationId, markClean, store]);

  // Undo/redo through zundo temporal store. Access via the stable `store`
  // reference (kept in state) rather than a ref so we don't trip React 19's
  // strict ref-during-render rule.
  const pastStates = useStore(store.temporal, (s) => s.pastStates);
  const futureStates = useStore(store.temporal, (s) => s.futureStates);
  const canUndo = pastStates.length > 0;
  const canRedo = futureStates.length > 0;

  // Keyboard shortcuts (undo/redo).
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;
      if (e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        store.temporal.getState().undo();
      } else if ((e.key === 'z' && e.shiftKey) || e.key === 'y') {
        e.preventDefault();
        store.temporal.getState().redo();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [store]);

  const handleChatSend = useCallback(
    async (instruction: string, attachmentKeys: string[]) => {
      if (chatStage !== 'idle') return;
      const localId = `local-${Date.now()}`;
      setChat((prev) => [
        ...prev,
        {
          id: localId,
          role: 'user',
          content:
            attachmentKeys.length > 0
              ? `${instruction}\n[+${attachmentKeys.length} image${attachmentKeys.length === 1 ? '' : 's'}]`
              : instruction,
          createdAt: new Date().toISOString(),
        },
      ]);
      setChatStage('sending');

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
        const message = body.error ?? `HTTP ${res.status}`;
        setChatStage('idle');
        toast.error(message);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let nl: number;
        while ((nl = buffer.indexOf('\n\n')) !== -1) {
          const raw = buffer.slice(0, nl);
          buffer = buffer.slice(nl + 2);
          if (!raw.startsWith('data: ')) continue;
          let event: unknown;
          try {
            event = JSON.parse(raw.slice(6));
          } catch {
            continue;
          }
          if (!event || typeof event !== 'object') continue;
          const evt = event as { type?: string; [k: string]: unknown };
          if (evt.type === 'progress') {
            if (evt.step === 'generating_tree') setChatStage('streaming');
            else if (evt.step === 'rendering_png') setChatStage('rendering');
          } else if (evt.type === 'done') {
            const parsed = bannerTreeSchema.safeParse(evt.tree);
            if (parsed.success) {
              setTree(parsed.data);
              // Clear undo history after AI edits so undo doesn't bring the
              // old tree back unexpectedly.
              store.temporal.getState().clear();
              store.getState().markClean();
            }
            setChat((prev) => [
              ...prev,
              {
                id: `local-${Date.now()}-a`,
                role: 'assistant',
                content: `Updated to v${evt.versionNumber}.`,
                createdAt: new Date().toISOString(),
              },
            ]);
            const cost = typeof evt.costUsd === 'number' ? `$${evt.costUsd.toFixed(4)}` : '';
            toast.success(`v${evt.versionNumber} ${cost}`);
            setChatStage('idle');
            router.refresh();
          } else if (evt.type === 'error') {
            const msg = typeof evt.message === 'string' ? evt.message : 'AI edit failed';
            setChatStage('idle');
            toast.error(msg);
          }
        }
      }
    },
    [chatStage, generationId, setTree, store, router],
  );

  const handleSelect = useCallback(
    (id: string | null, additive: boolean) => {
      if (!id) {
        setSelection([]);
        return;
      }
      const current = store.getState().selection;
      if (additive) {
        const next = current.includes(id)
          ? current.filter((x) => x !== id)
          : [...current, id];
        setSelection(next);
      } else {
        setSelection([id]);
      }
    },
    [setSelection, store],
  );

  return (
    <div className="grid h-[calc(100vh-220px)] min-h-[600px] grid-cols-[minmax(0,1fr)_320px] gap-4">
      <div className="flex min-h-0 flex-col rounded-lg border border-border bg-card">
        <Toolbar
          status={status}
          canUndo={canUndo}
          canRedo={canRedo}
          onUndo={() => store.temporal.getState().undo()}
          onRedo={() => store.temporal.getState().redo()}
        />
        <div className="grid min-h-0 flex-1 grid-cols-[220px_minmax(0,1fr)_280px] divide-x divide-border overflow-hidden">
          <div className="min-h-0 overflow-y-auto bg-card">
            <LayersPanel
              tree={tree}
              selection={selection}
              hover={hover}
              onSelect={handleSelect}
              onHover={setHover}
              onToggleVisible={(id, visible) => patchNode(id, { visible })}
              onToggleLocked={(id, locked) => patchNode(id, { locked })}
            />
          </div>
          <div className="min-h-0 overflow-hidden">
            <TreeCanvas
              tree={tree}
              selection={selection}
              hover={hover}
              onSelect={handleSelect}
              onHover={setHover}
              onDragSelected={moveSelectedBy}
              onPatchText={(id, text) => patchNode(id, { text })}
            />
          </div>
          <div className="min-h-0 overflow-y-auto bg-card">
            <Inspector tree={tree} selection={selection} onPatch={patchNode} />
          </div>
        </div>
      </div>
      <div className="flex min-h-0 flex-col gap-4 overflow-y-auto">
        <div className="flex items-center justify-end">
          <BackgroundButton
            workspaceId={workspaceId}
            generationId={generationId}
            disabled={chatStage !== 'idle'}
          />
        </div>
        <ChatPanel
          chat={chat}
          onSend={handleChatSend}
          disabled={chatStage !== 'idle'}
          workspaceId={workspaceId}
          stage={chatStage}
        />
        <VersionsPanel
          versions={versions}
          onRestore={async (versionId) => {
            const res = await restoreVersion(workspaceId, generationId, versionId);
            if (!res.ok) {
              toast.error(res.error);
              return;
            }
            toast.success(`Restored as v${res.data.versionNumber}`);
            router.refresh();
          }}
          disabled={chatStage !== 'idle'}
        />
      </div>
    </div>
  );
}

function Toolbar({
  status,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
}: {
  status: SaveStatus;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
}) {
  return (
    <div className="flex items-center justify-between border-b border-border px-3 py-2">
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          disabled={!canUndo}
          onClick={onUndo}
          aria-label="Undo"
        >
          <Undo2 className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          disabled={!canRedo}
          onClick={onRedo}
          aria-label="Redo"
        >
          <Redo2 className="size-4" />
        </Button>
      </div>
      <StatusPill status={status} />
    </div>
  );
}

function StatusPill({ status }: { status: SaveStatus }) {
  switch (status.kind) {
    case 'idle':
      return null;
    case 'saving':
      return (
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Loader2 className="size-3 animate-spin" />
          Saving…
        </span>
      );
    case 'saved':
      return (
        <span className="flex items-center gap-1.5 text-xs text-emerald-600">
          <CheckCircle2 className="size-3" />
          Saved
        </span>
      );
    case 'error':
      return (
        <span className="flex items-center gap-1.5 text-xs text-destructive">
          <XCircle className="size-3" />
          {status.message}
        </span>
      );
  }
}
