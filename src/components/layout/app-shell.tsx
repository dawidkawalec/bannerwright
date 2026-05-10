'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { DesktopSidebar } from './sidebar/desktop-sidebar';
import { MobileSidebar } from './sidebar/mobile-sidebar';
import { AppHeader } from './header';
import { AppFooter } from './footer';
import type { WorkspaceMini } from './sidebar/workspace-nav';

function useActiveWorkspaceId(): string | undefined {
  const pathname = usePathname();
  const match = pathname.match(/^\/workspaces\/([^/]+)/);
  if (!match) return undefined;
  const id = match[1];
  if (id === 'new') return undefined;
  return id;
}

export function AppShell({
  email,
  workspaces,
  children,
}: {
  email: string;
  workspaces: WorkspaceMini[];
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const workspaceId = useActiveWorkspaceId();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <DesktopSidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((c) => !c)}
        email={email}
        workspaceId={workspaceId}
        workspaces={workspaces}
      />
      <MobileSidebar
        open={mobileOpen}
        onOpenChange={setMobileOpen}
        email={email}
        workspaceId={workspaceId}
        workspaces={workspaces}
      />
      <div
        className={cn(
          'flex min-h-screen flex-col transition-[padding] duration-300',
          collapsed ? 'md:pl-[72px]' : 'md:pl-[260px]',
        )}
      >
        <AppHeader email={email} onOpenMobile={() => setMobileOpen(true)} />
        <main className="flex-1">
          <div className="mx-auto w-full max-w-[1400px] px-4 py-6 md:px-6 md:py-8">{children}</div>
        </main>
        <AppFooter />
      </div>
    </div>
  );
}
