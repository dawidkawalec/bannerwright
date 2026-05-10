'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/layout/logo';
import { QuickActions } from './quick-actions';
import { UserProfile } from './user-profile';
import {
  WorkspaceNav,
  WorkspaceNavGlobalLink,
  type WorkspaceMini,
} from './workspace-nav';

export function DesktopSidebar({
  collapsed,
  onToggle,
  email,
  workspaceId,
  workspaces,
}: {
  collapsed: boolean;
  onToggle: () => void;
  email: string;
  workspaceId?: string;
  workspaces: WorkspaceMini[];
}) {
  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground shadow-sm transition-all duration-300 md:flex',
        collapsed ? 'w-[72px]' : 'w-[260px]',
      )}
    >
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-sidebar-border px-3">
        <Logo showText={!collapsed} href="/workspaces" />
        {!collapsed && (
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon-sm" onClick={onToggle} aria-label="Collapse">
                <ChevronLeft className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Collapse</TooltipContent>
          </Tooltip>
        )}
      </div>

      {collapsed && (
        <div className="px-2 py-2">
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={onToggle}
                aria-label="Expand"
                className="w-full"
              >
                <ChevronRight className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Expand</TooltipContent>
          </Tooltip>
        </div>
      )}

      <ScrollArea className="flex-1 px-3">
        <div className="py-3">
          {!collapsed && (
            <h2 className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Overview
            </h2>
          )}
          <WorkspaceNavGlobalLink collapsed={collapsed} />
        </div>

        <div className="py-3">
          {!collapsed && (
            <h2 className="mb-2 flex items-center justify-between px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              <span>Workspaces</span>
              <span className="text-[9px] tabular-nums opacity-70">{workspaces.length}</span>
            </h2>
          )}
          <WorkspaceNav workspaces={workspaces} collapsed={collapsed} />
        </div>

        <div className="py-3">
          {!collapsed && (
            <h2 className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Quick actions
            </h2>
          )}
          <QuickActions collapsed={collapsed} workspaceId={workspaceId} />
        </div>
      </ScrollArea>

      <div className="mt-auto border-t border-sidebar-border p-3">
        {collapsed ? (
          <div className="flex justify-center">
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <button
                  aria-label={email}
                  className="grid size-9 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary"
                >
                  {email.slice(0, 2).toUpperCase()}
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">{email}</TooltipContent>
            </Tooltip>
          </div>
        ) : (
          <UserProfile email={email} />
        )}
      </div>
    </aside>
  );
}
