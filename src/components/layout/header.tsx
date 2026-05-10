'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { Bell, Menu, Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Logo } from '@/components/layout/logo';
import { cn } from '@/lib/utils';

export type HeaderNotification = {
  id: string;
  title: string;
  body: string;
  href?: string;
  tone: 'info' | 'success' | 'warning' | 'pending';
  createdAt: string;
};

export function AppHeader({
  email,
  onOpenMobile,
  onOpenPalette,
  notifications,
}: {
  email: string;
  onOpenMobile: () => void;
  onOpenPalette: () => void;
  notifications: HeaderNotification[];
}) {
  const initials = email.slice(0, 2).toUpperCase();

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-background/85 px-4 backdrop-blur-md md:px-6">
      <Button
        variant="ghost"
        size="icon-sm"
        className="md:hidden"
        onClick={onOpenMobile}
        aria-label="Open menu"
      >
        <Menu className="size-4" />
      </Button>
      <div className="md:hidden">
        <Logo showText={false} />
      </div>

      {/* Search button -> opens command palette */}
      <button
        onClick={onOpenPalette}
        className="ml-auto hidden h-9 max-w-sm flex-1 items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground md:flex"
      >
        <Search className="size-4" />
        <span className="flex-1 truncate text-left">Search workspaces, banners…</span>
        <kbd className="rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[10px]">
          ⌘K
        </kbd>
      </button>

      {/* Mobile palette icon */}
      <Button
        variant="ghost"
        size="icon-sm"
        className="ml-auto md:hidden"
        onClick={onOpenPalette}
        aria-label="Search"
      >
        <Search className="size-4" />
      </Button>

      <div className="flex items-center gap-2 md:ml-2">
        <NotificationsMenu notifications={notifications} />
        <Tooltip>
          <TooltipTrigger asChild>
            <Button asChild variant="default" size="sm" className="hidden sm:inline-flex">
              <Link href="/workspaces/new">
                <Plus className="size-3.5" />
                New workspace
              </Link>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Create a new workspace</TooltipContent>
        </Tooltip>
        <ProfileMenu email={email} initials={initials} />
      </div>
    </header>
  );
}

function NotificationsMenu({ notifications }: { notifications: HeaderNotification[] }) {
  const unread = notifications.length;
  const dot = unread > 0;

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" aria-label="Notifications" className="relative">
              <Bell className="size-4" />
              {dot && (
                <span className="absolute right-1 top-1 grid size-3.5 place-items-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
                  {Math.min(unread, 9)}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent>{unread > 0 ? `${unread} update${unread === 1 ? '' : 's'}` : 'No new updates'}</TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Activity</span>
          {unread > 0 && (
            <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-primary">
              {unread} new
            </span>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <div className="px-3 py-6 text-center text-xs text-muted-foreground">
            All caught up — no recent activity.
          </div>
        ) : (
          notifications.map((n) => (
            <DropdownMenuItem
              key={n.id}
              asChild={Boolean(n.href)}
              className="flex flex-col items-start gap-0.5"
            >
              {n.href ? (
                <Link href={n.href}>
                  <NotificationContent n={n} />
                </Link>
              ) : (
                <div className="flex w-full flex-col items-start">
                  <NotificationContent n={n} />
                </div>
              )}
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function NotificationContent({ n }: { n: HeaderNotification }) {
  return (
    <>
      <div className="flex w-full items-center gap-2">
        <span
          className={cn(
            'size-2 shrink-0 rounded-full',
            n.tone === 'success' && 'bg-emerald-400',
            n.tone === 'warning' && 'bg-amber-400',
            n.tone === 'info' && 'bg-primary',
            n.tone === 'pending' && 'bg-blue-400 animate-pulse',
          )}
        />
        <p className="flex-1 truncate text-sm font-medium text-foreground">{n.title}</p>
        <span className="text-[10px] text-muted-foreground">{n.createdAt}</span>
      </div>
      <p className="line-clamp-2 pl-4 text-xs text-muted-foreground">{n.body}</p>
    </>
  );
}

function ProfileMenu({ email, initials }: { email: string; initials: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const signOut = () =>
    startTransition(async () => {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.replace('/login');
      router.refresh();
    });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex items-center gap-2 rounded-full p-0.5 transition hover:bg-muted"
          aria-label="Profile"
        >
          <Avatar className="size-8">
            <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel>
          <p className="text-xs text-muted-foreground">Signed in as</p>
          <p className="truncate text-sm font-medium text-foreground">{email}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/account">Account settings</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/workspaces">Dashboard</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/workspaces/new">New workspace</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <a
            href="https://github.com/anthropics/bannerwright"
            target="_blank"
            rel="noreferrer"
          >
            Documentation
          </a>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault();
            signOut();
          }}
          disabled={pending}
          className="text-destructive focus:text-destructive"
        >
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
