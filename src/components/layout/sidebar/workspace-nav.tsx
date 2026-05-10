'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { ChevronRight, FolderKanban, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { workspaceNavItems } from '@/components/layout/nav-items';

export type WorkspaceMini = { id: string; name: string; slug: string };

export function WorkspaceNav({
  workspaces,
  collapsed,
  onItemClick,
}: {
  workspaces: WorkspaceMini[];
  collapsed?: boolean;
  onItemClick?: () => void;
}) {
  const pathname = usePathname();
  const activeId = pathname.match(/^\/workspaces\/([^/]+)/)?.[1];
  // Track only user-initiated overrides; default expanded = active workspace.
  const [overrideId, setOverrideId] = useState<string | null | undefined>(undefined);
  const expandedId = overrideId === undefined ? (activeId ?? null) : overrideId;
  const toggle = (id: string) => setOverrideId(expandedId === id ? null : id);

  if (workspaces.length === 0) {
    return collapsed ? (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <Button asChild variant="outline" size="sm" className="w-full justify-center">
            <Link href="/workspaces/new" onClick={onItemClick}>
              <Plus className="size-4" />
            </Link>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">Create workspace</TooltipContent>
      </Tooltip>
    ) : (
      <div className="rounded-lg border border-dashed border-border px-3 py-3 text-center">
        <p className="text-xs text-muted-foreground">No workspaces yet</p>
        <Button asChild variant="outline" size="sm" className="mt-2 w-full">
          <Link href="/workspaces/new" onClick={onItemClick}>
            <Plus className="size-3.5" />
            New workspace
          </Link>
        </Button>
      </div>
    );
  }

  if (collapsed) {
    return (
      <div className="grid gap-1">
        {workspaces.slice(0, 8).map((w) => {
          const active = w.id === activeId;
          return (
            <Tooltip key={w.id} delayDuration={0}>
              <TooltipTrigger asChild>
                <Link
                  href={`/workspaces/${w.id}`}
                  onClick={onItemClick}
                  className={cn(
                    'grid place-items-center rounded-md p-2 text-xs font-semibold uppercase transition-colors',
                    active
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-muted/40 text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                  )}
                >
                  {w.name.slice(0, 2)}
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">{w.name}</TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0.5">
      {workspaces.map((w) => {
        const isActive = w.id === activeId;
        const isExpanded = expandedId === w.id;
        return (
          <div key={w.id} className="flex flex-col">
            <div
              className={cn(
                'group flex items-center rounded-md transition-colors',
                isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground',
              )}
            >
              <button
                type="button"
                aria-expanded={isExpanded}
                onClick={() => toggle(w.id)}
                className={cn(
                  'grid size-7 place-items-center rounded-md transition-colors',
                  'hover:bg-accent hover:text-accent-foreground',
                )}
              >
                <ChevronRight
                  className={cn('size-3.5 transition-transform', isExpanded && 'rotate-90')}
                />
              </button>
              <Link
                href={`/workspaces/${w.id}`}
                onClick={onItemClick}
                className={cn(
                  'flex flex-1 items-center gap-2 truncate rounded-md px-2 py-1.5 text-sm font-medium',
                  isActive
                    ? 'text-primary'
                    : 'text-foreground hover:bg-accent hover:text-accent-foreground',
                )}
              >
                <span
                  className={cn(
                    'grid size-5 shrink-0 place-items-center rounded text-[10px] font-bold uppercase',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground',
                  )}
                >
                  {w.name.slice(0, 2)}
                </span>
                <span className="truncate">{w.name}</span>
              </Link>
            </div>
            {isExpanded && (
              <ul className="mb-1 ml-7 mt-0.5 flex flex-col gap-0.5 border-l border-border pl-2">
                {workspaceNavItems(w.id).slice(1).map((item) => {
                  const itemActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                  const Icon = item.icon;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={onItemClick}
                        className={cn(
                          'flex items-center gap-2 rounded-md px-2 py-1 text-xs transition-colors',
                          itemActive
                            ? 'text-primary'
                            : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                        )}
                      >
                        <Icon className="size-3.5" />
                        {item.name}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        );
      })}
      <Button asChild variant="ghost" size="sm" className="mt-2 w-full justify-start">
        <Link href="/workspaces/new" onClick={onItemClick}>
          <Plus className="size-3.5" />
          New workspace
        </Link>
      </Button>
    </div>
  );
}

export function WorkspaceNavGlobalLink({
  collapsed,
  onItemClick,
}: {
  collapsed?: boolean;
  onItemClick?: () => void;
}) {
  const pathname = usePathname();
  const active = pathname === '/workspaces';

  if (collapsed) {
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <Link
            href="/workspaces"
            onClick={onItemClick}
            className={cn(
              'flex items-center justify-center rounded-md p-2 transition-colors',
              active
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
            )}
          >
            <FolderKanban className="size-5" />
          </Link>
        </TooltipTrigger>
        <TooltipContent side="right">Dashboard</TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Link
      href="/workspaces"
      onClick={onItemClick}
      className={cn(
        'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
        active
          ? 'bg-primary/10 text-primary'
          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
      )}
    >
      <FolderKanban className={cn('size-4 shrink-0', active ? 'text-primary' : '')} />
      Dashboard
    </Link>
  );
}
