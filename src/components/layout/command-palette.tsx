'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  Database,
  FolderKanban,
  Image as ImageIcon,
  LayoutDashboard,
  LayoutTemplate,
  Plus,
  Search,
  Settings as SettingsIcon,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import type { WorkspaceMini } from '@/components/layout/sidebar/workspace-nav';

type Item = {
  id: string;
  label: string;
  hint: string;
  href: string;
  icon: LucideIcon;
  group: 'Navigate' | 'Workspaces' | 'Quick action';
};

export function CommandPalette({
  open,
  onOpenChange,
  workspaces,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  workspaces: WorkspaceMini[];
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="top"
        className="left-1/2 top-[10vh] max-h-[80vh] w-full max-w-xl -translate-x-1/2 rounded-2xl p-0"
        showCloseButton={false}
      >
        <SheetHeader className="sr-only">
          <SheetTitle>Command palette</SheetTitle>
          <SheetDescription>Jump to any workspace, page, or action.</SheetDescription>
        </SheetHeader>
        {/* Inner is mounted only while open — fresh state every time */}
        <PaletteInner workspaces={workspaces} onClose={() => onOpenChange(false)} />
      </SheetContent>
    </Sheet>
  );
}

function PaletteInner({
  workspaces,
  onClose,
}: {
  workspaces: WorkspaceMini[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Autofocus the input as soon as the palette opens (no state changes here).
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const items = useMemo<Item[]>(() => {
    const base: Item[] = [
      {
        id: 'nav-dashboard',
        label: 'Dashboard',
        hint: 'Global overview',
        href: '/workspaces',
        icon: LayoutDashboard,
        group: 'Navigate',
      },
      {
        id: 'nav-account',
        label: 'Account settings',
        hint: 'Profile, theme, API keys',
        href: '/account',
        icon: SettingsIcon,
        group: 'Navigate',
      },
      {
        id: 'qa-new-ws',
        label: 'New workspace',
        hint: 'Set up a brand workspace',
        href: '/workspaces/new',
        icon: Plus,
        group: 'Quick action',
      },
    ];

    const wsItems: Item[] = workspaces.flatMap<Item>((w) => [
      {
        id: `ws-${w.id}`,
        label: w.name,
        hint: 'Open workspace dashboard',
        href: `/workspaces/${w.id}`,
        icon: FolderKanban,
        group: 'Workspaces',
      },
      {
        id: `ws-${w.id}-gen`,
        label: `${w.name} · Generate banner`,
        hint: 'Brief in, banner out',
        href: `/workspaces/${w.id}/generations/new`,
        icon: Sparkles,
        group: 'Quick action',
      },
      {
        id: `ws-${w.id}-banners`,
        label: `${w.name} · Generations`,
        hint: 'Browse banners',
        href: `/workspaces/${w.id}/generations`,
        icon: ImageIcon,
        group: 'Workspaces',
      },
      {
        id: `ws-${w.id}-kb`,
        label: `${w.name} · Knowledge base`,
        hint: 'URLs, uploads, brand notes',
        href: `/workspaces/${w.id}/knowledge-base`,
        icon: Database,
        group: 'Workspaces',
      },
      {
        id: `ws-${w.id}-tpl`,
        label: `${w.name} · Templates`,
        hint: 'Reusable banners',
        href: `/workspaces/${w.id}/templates`,
        icon: LayoutTemplate,
        group: 'Workspaces',
      },
      {
        id: `ws-${w.id}-set`,
        label: `${w.name} · Settings`,
        hint: 'Brand, fonts, danger zone',
        href: `/workspaces/${w.id}/settings`,
        icon: SettingsIcon,
        group: 'Workspaces',
      },
    ]);

    return [...base, ...wsItems];
  }, [workspaces]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (i) => i.label.toLowerCase().includes(q) || i.hint.toLowerCase().includes(q),
    );
  }, [items, query]);

  // Clamp active index at render time (no effect needed)
  const boundedActive =
    filtered.length === 0 ? 0 : Math.min(active, filtered.length - 1);

  // Group filtered items by group, preserving original ordering
  const grouped = useMemo(() => {
    const map = new Map<Item['group'], Item[]>();
    for (const it of filtered) {
      const arr = map.get(it.group) ?? [];
      arr.push(it);
      map.set(it.group, arr);
    }
    return Array.from(map.entries());
  }, [filtered]);

  function go(i: number) {
    const item = filtered[i];
    if (!item) return;
    onClose();
    router.push(item.href);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive(Math.min(filtered.length - 1, boundedActive + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive(Math.max(0, boundedActive - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      go(boundedActive);
    } else if (e.key === 'Escape') {
      onClose();
    }
  }

  return (
    <>
      <div className="flex items-center gap-3 border-b border-border px-4">
        <Search className="size-4 text-muted-foreground" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
          }}
          onKeyDown={onKeyDown}
          placeholder="Type to search workspaces, pages, actions…"
          className="h-12 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
        />
        <kbd className="hidden rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground sm:inline-block">
          ESC
        </kbd>
      </div>

      <div className="max-h-[60vh] overflow-y-auto p-2">
        {filtered.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-muted-foreground">
            No matches for &ldquo;{query}&rdquo;.
          </div>
        ) : (
          grouped.map(([group, list]) => (
            <div key={group} className="mb-3 last:mb-0">
              <p className="px-2 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {group}
              </p>
              <ul className="grid gap-0.5">
                {list.map((item) => {
                  const idx = filtered.indexOf(item);
                  const isActive = idx === boundedActive;
                  const Icon = item.icon;
                  return (
                    <li key={item.id}>
                      <Link
                        href={item.href}
                        onMouseEnter={() => setActive(idx)}
                        onClick={onClose}
                        className={cn(
                          'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                          isActive
                            ? 'bg-primary/10 text-primary'
                            : 'text-foreground hover:bg-accent hover:text-accent-foreground',
                        )}
                      >
                        <Icon
                          className={cn(
                            'size-4 shrink-0',
                            isActive ? 'text-primary' : 'text-muted-foreground',
                          )}
                        />
                        <span className="flex-1 truncate">{item.label}</span>
                        <span className="hidden text-xs text-muted-foreground sm:inline">
                          {item.hint}
                        </span>
                        <ArrowRight
                          className={cn(
                            'size-3.5',
                            isActive ? 'text-primary' : 'text-muted-foreground/50',
                          )}
                        />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))
        )}
      </div>

      <div className="flex items-center justify-between border-t border-border bg-muted/30 px-4 py-2 text-[11px] text-muted-foreground">
        <span>
          <kbd className="rounded bg-background px-1 font-medium">↑↓</kbd> navigate ·{' '}
          <kbd className="rounded bg-background px-1 font-medium">↵</kbd> open
        </span>
        <span>
          <kbd className="rounded bg-background px-1 font-medium">⌘K</kbd> to toggle
        </span>
      </div>
    </>
  );
}
