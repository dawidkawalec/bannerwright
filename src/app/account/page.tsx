import {
  Bell,
  Cpu,
  Key,
  Palette,
  Shield,
  User as UserIcon,
} from 'lucide-react';
import { requireUser } from '@/lib/auth/current-user';
import { listWorkspacesByUser } from '@/lib/db/queries/workspaces';
import { getGlobalStats } from '@/lib/db/queries/stats';
import { getHeaderNotifications } from '@/lib/db/queries/notifications';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { AppearanceForm } from '@/app/workspaces/[id]/settings/appearance-form';
import {
  ApiForm,
  NotificationsForm,
  ProfileForm,
  StudioForm,
} from './account-forms';

export const metadata = { title: 'Account — Bannerwright' };

export default async function AccountPage() {
  const user = await requireUser();
  const [workspaces, stats, notifications] = await Promise.all([
    listWorkspacesByUser(user.id),
    getGlobalStats(user.id),
    getHeaderNotifications(user.id),
  ]);
  const mini = workspaces.map((w) => ({ id: w.id, name: w.name, slug: w.slug }));
  const handle = user.email.split('@')[0];
  const initials = user.email.slice(0, 2).toUpperCase();
  const memberSince = new Date(user.createdAt).toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'long',
  });

  const seed = {
    email: user.email,
    defaultDisplayName: handle,
    defaultTimezone: 'UTC',
  };

  return (
    <AppShell email={user.email} workspaces={mini} notifications={notifications}>
      <div className="flex flex-col gap-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="size-16 ring-2 ring-primary/30">
              <AvatarFallback className="bg-gradient-to-br from-primary to-primary/60 text-lg font-semibold text-primary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">{handle}</h1>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="border-primary/30 text-primary">
                  Owner
                </Badge>
                <span className="text-xs text-muted-foreground">Member since {memberSince}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <SnapStat label="Workspaces" value={stats.workspaces} />
            <SnapStat label="Banners" value={stats.generations} />
            <SnapStat label="Spent" value={`$${stats.totalCostUsd.toFixed(2)}`} />
          </div>
        </header>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="profile">
              <UserIcon className="size-3.5" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="appearance">
              <Palette className="size-3.5" />
              Appearance
            </TabsTrigger>
            <TabsTrigger value="notifications">
              <Bell className="size-3.5" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="security">
              <Shield className="size-3.5" />
              Security
            </TabsTrigger>
            <TabsTrigger value="api">
              <Key className="size-3.5" />
              API & AI
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Profile</CardTitle>
                <CardDescription>Your handle and locale used across the workshop.</CardDescription>
              </CardHeader>
              <CardContent>
                <ProfileForm seed={seed} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Studio defaults</CardTitle>
                <CardDescription>Defaults applied to new banners and workspaces.</CardDescription>
              </CardHeader>
              <CardContent>
                <StudioForm seed={seed} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appearance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Appearance</CardTitle>
                <CardDescription>
                  Theme is forced dark for now. Pick a font and density that suit you.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AppearanceForm />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Cpu className="size-4 text-primary" />
                  Notification triggers
                </CardTitle>
                <CardDescription>
                  Choose what shows up in the bell menu and when to mirror to email.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <NotificationsForm seed={seed} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Sessions</CardTitle>
                <CardDescription>Devices currently signed into this account.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border border-border bg-muted/30 p-3">
                  <p className="text-sm font-medium text-foreground">This device</p>
                  <p className="text-xs text-muted-foreground">
                    Active session — sign out from the profile menu.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Password</CardTitle>
                <CardDescription>
                  Single-tenant install — passwords are managed via the seed CLI.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="overflow-x-auto rounded-md bg-muted/50 p-3 font-mono text-xs text-muted-foreground">
                  pnpm tsx scripts/hash-password.ts &lt;new-password&gt;{'\n'}
                  # update ADMIN_PASSWORD_HASH in .env, then re-run db:seed
                </pre>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="api" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Cpu className="size-4 text-primary" />
                  AI provider
                </CardTitle>
                <CardDescription>
                  Bannerwright talks to Google Gemini directly — your key, your data.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ApiForm seed={seed} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}

function SnapStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 text-center">
      <p className="text-lg font-semibold text-foreground">{value}</p>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
    </div>
  );
}
