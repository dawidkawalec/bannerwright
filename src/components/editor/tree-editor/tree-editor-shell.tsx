'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useStore } from 'zustand';
import { CheckCircle2, Loader2, Redo2, Undo2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { saveTreeEdit } from '@/app/actions/generations';
import { createEditorStore } from '@/lib/tree/store';
import type { BannerTree } from '@/lib/tree/types';
import { TreeCanvas } from './canvas';
import { LayersPanel } from './layers-panel';
import { Inspector } from './inspector';

const AUTOSAVE_DEBOUNCE_MS = 800;

export type TreeEditorShellProps = {
  workspaceId: string;
  generationId: string;
  initialTree: BannerTree;
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
}: TreeEditorShellProps) {
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
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    <div className="flex h-[calc(100vh-220px)] min-h-[600px] flex-col rounded-lg border border-border bg-card">
      <Toolbar
        status={status}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={() => store.temporal.getState().undo()}
        onRedo={() => store.temporal.getState().redo()}
      />
      <div className="grid flex-1 grid-cols-[220px_minmax(0,1fr)_280px] divide-x divide-border overflow-hidden">
        <div className="overflow-y-auto bg-card">
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
        <div className="overflow-hidden">
          <TreeCanvas
            tree={tree}
            selection={selection}
            hover={hover}
            onSelect={handleSelect}
            onHover={setHover}
            onDragSelected={moveSelectedBy}
          />
        </div>
        <div className="overflow-y-auto bg-card">
          <Inspector tree={tree} selection={selection} onPatch={patchNode} />
        </div>
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
