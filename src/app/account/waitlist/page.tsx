import { requireUser } from '@/lib/auth/current-user';
import { listWaitlistSignups, getWaitlistStats } from '@/lib/db/queries/waitlist';
import { AppShell } from '@/components/layout/app-shell';
import { listWorkspacesByUser } from '@/lib/db/queries/workspaces';
import { getHeaderNotifications } from '@/lib/db/queries/notifications';
import { WaitlistTable } from './waitlist-table';

export const metadata = { title: 'Waitlist — Bannerwright' };

export default async function WaitlistAdminPage() {
  const user = await requireUser();
  const [workspaces, notifications, signups, stats] = await Promise.all([
    listWorkspacesByUser(user.id),
    getHeaderNotifications(user.id),
    listWaitlistSignups(),
    getWaitlistStats(),
  ]);

  const mini = workspaces.map((w) => ({ id: w.id, name: w.name, slug: w.slug }));

  return (
    <AppShell email={user.email} workspaces={mini} notifications={notifications}>
      <div className="mx-auto max-w-6xl space-y-8 p-6 md:p-10">
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-6">
          <div>
            <span className="text-xs font-medium uppercase tracking-[0.18em] text-primary">
              Private beta
            </span>
            <h1 className="mt-2 text-2xl font-light tracking-tight text-foreground md:text-3xl">
              Waitlist signups
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Anyone who's hit the early-access CTA on the marketing page.
            </p>
          </div>
          <div className="grid grid-cols-4 gap-2 text-center text-xs">
            <Stat label="Total" value={stats.total} />
            <Stat label="Pending" value={stats.pending} accent />
            <Stat label="Contacted" value={stats.contacted} />
            <Stat label="Installed" value={stats.installed} />
          </div>
        </header>

        <WaitlistTable signups={signups} />
      </div>
    </AppShell>
  );
}

function Stat({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border px-3 py-2 ${
        accent ? 'border-primary/30 bg-primary/10 text-primary' : 'border-border bg-card'
      }`}
    >
      <div className="text-lg font-medium">{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  );
}
