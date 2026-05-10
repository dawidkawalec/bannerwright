import Link from 'next/link';
import { Hammer, Plus } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { LogoutButton } from './logout-button';
import type { Workspace } from '@/lib/db/schema';
import { cn } from '@/lib/utils';

export function AppNav({
  email,
  workspaces,
  activeWorkspaceId,
}: {
  email: string;
  workspaces: Workspace[];
  activeWorkspaceId?: string;
}) {
  const initials = email.slice(0, 2).toUpperCase();
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-6">
        <div className="flex items-center gap-6">
          <Link
            href="/workspaces"
            className="flex items-center gap-2 text-sm font-semibold tracking-tight text-slate-900 transition-colors hover:text-indigo-600"
          >
            <span className="grid size-7 place-items-center rounded-md bg-slate-900 text-slate-50">
              <Hammer className="size-4" />
            </span>
            Bannerwright
          </Link>
          {workspaces.length > 0 && (
            <nav className="flex items-center gap-1">
              {workspaces.slice(0, 5).map((w) => (
                <Link
                  key={w.id}
                  href={`/workspaces/${w.id}`}
                  className={cn(
                    'rounded-md px-2 py-1 text-sm transition-colors',
                    w.id === activeWorkspaceId
                      ? 'bg-slate-900 text-slate-50'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900',
                  )}
                >
                  {w.name}
                </Link>
              ))}
              {workspaces.length > 5 && (
                <Link
                  href="/workspaces"
                  className="rounded-md px-2 py-1 text-sm text-slate-700 hover:bg-slate-100"
                >
                  +{workspaces.length - 5} more
                </Link>
              )}
            </nav>
          )}
        </div>
        <div className="flex items-center gap-3 text-sm text-slate-700">
          <Link
            href="/workspaces/new"
            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
          >
            <Plus className="size-3.5" />
            New workspace
          </Link>
          <Avatar className="size-8">
            <AvatarFallback className="bg-slate-900 text-xs text-slate-50">
              {initials}
            </AvatarFallback>
          </Avatar>
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
