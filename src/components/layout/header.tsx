'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useTransition } from 'react';
import { Bell, Menu, Moon, Plus, Search, Sun } from 'lucide-react';
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

export function AppHeader({
  email,
  onOpenMobile,
}: {
  email: string;
  onOpenMobile: () => void;
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

      {/* Search (placeholder) */}
      <div className="ml-auto hidden flex-1 max-w-sm items-center md:flex">
        <div className="relative w-full">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            placeholder="Search workspaces, banners…"
            className="h-9 w-full rounded-lg border border-border bg-muted/40 pl-9 pr-3 text-sm outline-none transition focus:bg-background focus:ring-2 focus:ring-ring/30"
          />
        </div>
      </div>

      <div className="ml-auto flex items-center gap-2 md:ml-2">
        <ThemeToggle />
        <NotificationsMenu />
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

function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const isDark = (theme === 'system' ? resolvedTheme : theme) === 'dark';
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Toggle theme"
          onClick={() => setTheme(isDark ? 'light' : 'dark')}
        >
          {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{isDark ? 'Light mode' : 'Dark mode'}</TooltipContent>
    </Tooltip>
  );
}

function NotificationsMenu() {
  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" aria-label="Notifications" className="relative">
              <Bell className="size-4" />
              <span className="absolute right-1 top-1 size-1.5 rounded-full bg-primary" />
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent>Notifications</TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel>Recent activity</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="flex flex-col items-start gap-0.5">
          <p className="text-sm font-medium">Welcome to Bannerwright</p>
          <p className="text-xs text-muted-foreground">
            Create your first workspace to get started.
          </p>
        </DropdownMenuItem>
        <DropdownMenuItem className="flex flex-col items-start gap-0.5">
          <p className="text-sm font-medium">Tip: connect a brand site</p>
          <p className="text-xs text-muted-foreground">
            Add the client&apos;s URL in Knowledge base for richer banners.
          </p>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
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
