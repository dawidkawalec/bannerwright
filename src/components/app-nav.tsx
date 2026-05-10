import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
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
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <div className="flex items-center gap-6">
          <Link href="/workspaces" className="text-sm font-semibold tracking-tight text-slate-900">
            Bannerwright
          </Link>
          {workspaces.length > 0 && (
            <nav className="flex items-center gap-1">
              {workspaces.slice(0, 5).map((w) => (
                <Link
                  key={w.id}
                  href={`/workspaces/${w.id}`}
                  className={`rounded-md px-2 py-1 text-sm ${
                    w.id === activeWorkspaceId
                      ? 'bg-slate-900 text-slate-50'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {w.name}
                </Link>
              ))}
              {workspaces.length > 5 && (
                <Link
                  href="/workspaces"
                  className="rounded-md px-2 py-1 text-sm text-slate-600 hover:bg-slate-100"
                >
                  +{workspaces.length - 5} more
                </Link>
              )}
            </nav>
          )}
        </div>
        <div className="flex items-center gap-3 text-sm text-slate-600">
          <span>{email}</span>
          <Link
            href="/workspaces/new"
            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
          >
            New workspace
          </Link>
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
