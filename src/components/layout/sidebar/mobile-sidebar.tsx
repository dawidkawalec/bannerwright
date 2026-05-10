'use client';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Logo } from '@/components/layout/logo';
import { QuickActions } from './quick-actions';
import { UserProfile } from './user-profile';
import {
  WorkspaceNav,
  WorkspaceNavGlobalLink,
  type WorkspaceMini,
} from './workspace-nav';

export function MobileSidebar({
  open,
  onOpenChange,
  email,
  workspaceId,
  workspaces,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  email: string;
  workspaceId?: string;
  workspaces: WorkspaceMini[];
}) {
  const close = () => onOpenChange(false);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-[280px] p-0">
        <SheetHeader className="sr-only">
          <SheetTitle>Navigation</SheetTitle>
          <SheetDescription>Bannerwright sidebar</SheetDescription>
        </SheetHeader>
        <div className="flex h-16 items-center border-b border-sidebar-border px-4">
          <Logo href="/workspaces" />
        </div>
        <ScrollArea className="h-[calc(100vh-4rem-72px)] px-3">
          <div className="py-3">
            <h2 className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Overview
            </h2>
            <WorkspaceNavGlobalLink onItemClick={close} />
          </div>
          <div className="py-3">
            <h2 className="mb-2 flex items-center justify-between px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              <span>Workspaces</span>
              <span className="text-[9px] tabular-nums opacity-70">{workspaces.length}</span>
            </h2>
            <WorkspaceNav workspaces={workspaces} onItemClick={close} />
          </div>
          <div className="py-3">
            <h2 className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Quick actions
            </h2>
            <QuickActions workspaceId={workspaceId} onItemClick={close} />
          </div>
        </ScrollArea>
        <div className="absolute inset-x-0 bottom-0 border-t border-sidebar-border bg-card p-3">
          <UserProfile email={email} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
