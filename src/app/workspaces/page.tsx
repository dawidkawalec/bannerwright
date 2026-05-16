import { requireUser } from '@/lib/auth/current-user';
import { listWorkspacesByUser } from '@/lib/db/queries/workspaces';
import {
  getGenerationsTimeseries,
  getGlobalStats,
  getRecentGenerations,
  getStatsForWorkspaces,
} from '@/lib/db/queries/stats';
import { StatsCards, type StatCard } from '@/components/dashboard/stats-cards';
import { GenerationsChart } from '@/components/dashboard/generations-chart';
import { RecentGenerations } from '@/components/dashboard/recent-generations';
import { OnboardingHero } from '@/components/dashboard/onboarding-hero';
import { QuickActionsCard } from '@/components/dashboard/quick-actions-card';
import { WorkspaceGrid } from '@/components/dashboard/workspace-grid';

export const metadata = { title: 'Dashboard — Bannerwright' };

export default async function WorkspacesPage() {
  const user = await requireUser();
  const workspaces = await listWorkspacesByUser(user.id);

  if (workspaces.length === 0) {
    return <OnboardingHero email={user.email} />;
  }

  const [stats, timeseries, recent] = await Promise.all([
    getGlobalStats(user.id),
    getGenerationsTimeseries({ userId: user.id, days: 30 }),
    getRecentGenerations({ userId: user.id, limit: 8 }),
  ]);

  const statsByWs = await getStatsForWorkspaces(workspaces.map((w) => w.id));

  // Build sparkline arrays from the 30-day series.
  const countSeries = timeseries.map((p) => p.count);
  const costSeries = timeseries.map((p) => p.costUsd);
  // workspaces sparkline: cumulative (always non-decreasing, just a flat-ish line)
  const wsSparkline = [
    Math.max(0, stats.workspaces - 4),
    Math.max(0, stats.workspaces - 3),
    Math.max(0, stats.workspaces - 2),
    Math.max(0, stats.workspaces - 1),
    stats.workspaces,
  ];
  const kbSparkline = [
    Math.max(0, stats.kbSources - 4),
    Math.max(0, stats.kbSources - 3),
    Math.max(0, stats.kbSources - 2),
    Math.max(0, stats.kbSources - 1),
    stats.kbSources,
  ];

  const statItems: StatCard[] = [
    {
      title: 'Workspaces',
      value: String(stats.workspaces),
      iconKey: 'workspaces',
      gradient: 'from-emerald-500 to-teal-500',
      strokeColor: '#10b981',
      series: wsSparkline,
      change: workspaces.length > 0 ? `${workspaces.length} active` : 'create your first',
      trend: 'flat',
    },
    {
      title: 'Generations',
      value: stats.generations.toLocaleString(),
      iconKey: 'image',
      gradient: 'from-blue-500 to-indigo-500',
      strokeColor: '#3b82f6',
      series: countSeries.length ? countSeries : [0, 0, 0, 0, 0],
      change: `${countSeries.slice(-7).reduce((a, b) => a + b, 0)} in last 7 days`,
      trend: countSeries.slice(-7).reduce((a, b) => a + b, 0) > 0 ? 'up' : 'flat',
    },
    {
      title: 'AI cost',
      value: `$${stats.totalCostUsd.toFixed(2)}`,
      iconKey: 'dollar',
      gradient: 'from-violet-500 to-purple-500',
      strokeColor: '#8b5cf6',
      series: costSeries.length ? costSeries : [0, 0, 0, 0, 0],
      change: `$${costSeries.slice(-7).reduce((a, b) => a + b, 0).toFixed(2)} this week`,
      trend: costSeries.slice(-7).reduce((a, b) => a + b, 0) > 0 ? 'up' : 'flat',
    },
    {
      title: 'Knowledge sources',
      value: String(stats.kbSources),
      iconKey: 'database',
      gradient: 'from-rose-500 to-pink-500',
      strokeColor: '#f43f5e',
      series: kbSparkline,
      change: `across ${workspaces.length} workspace${workspaces.length === 1 ? '' : 's'}`,
      trend: 'flat',
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-primary">
            Bannerwright
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Welcome back, {user.email.split('@')[0]}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Your AI banner workshop — at a glance.
          </p>
        </div>
      </header>

      <StatsCards items={statItems} />

      {/* Primary content: workspaces grid + recent gens (left, 2/3) and chart/quick actions (right, 1/3) */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <section className="space-y-3">
            <div className="flex items-end justify-between">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Your workspaces</h2>
                <p className="text-sm text-muted-foreground">
                  {workspaces.length === 0
                    ? 'You have no workspaces yet — create one for your first brand.'
                    : `${workspaces.length} workspace${workspaces.length === 1 ? '' : 's'} · click any card to enter the workshop.`}
                </p>
              </div>
            </div>
            <WorkspaceGrid workspaces={workspaces} stats={statsByWs} />
          </section>

          <RecentGenerations rows={recent} />
        </div>

        <div className="space-y-6">
          <QuickActionsCard />
          <GenerationsChart
            data={timeseries}
            title="Activity"
            description="Banners and AI cost per day."
          />
          <BrandTipsCard />
        </div>
      </div>
    </div>
  );
}

function BrandTipsCard() {
  const tips = [
    {
      title: 'Anchor with the brand site',
      body: 'Add the client’s URL in Knowledge base — auto-extracts colours, fonts, tone.',
    },
    {
      title: 'Iterate via chat',
      body: 'Each AI edit creates a new version — restore any moment in seconds.',
    },
    {
      title: 'Promote to template',
      body: 'A great banner becomes a reusable template across briefs.',
    },
  ];
  return (
    <div className="rounded-xl border border-border bg-gradient-to-br from-primary/5 via-background to-blue-500/5 p-5">
      <p className="text-xs font-semibold uppercase tracking-widest text-primary">
        Workshop tips
      </p>
      <ul className="mt-3 space-y-3">
        {tips.map((t) => (
          <li key={t.title}>
            <p className="text-sm font-medium text-foreground">{t.title}</p>
            <p className="text-xs text-muted-foreground">{t.body}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
