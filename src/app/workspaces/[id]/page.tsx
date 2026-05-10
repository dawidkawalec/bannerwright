import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowRight,
  Palette,
  Settings as SettingsIcon,
  Sparkles,
  Type,
} from 'lucide-react';
import { requireUser } from '@/lib/auth/current-user';
import { getWorkspaceForUser } from '@/lib/db/queries/workspaces';
import {
  getGenerationsTimeseries,
  getRecentGenerations,
  getWorkspaceStats,
} from '@/lib/db/queries/stats';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StatsCards, type StatCard } from '@/components/dashboard/stats-cards';
import { GenerationsChart } from '@/components/dashboard/generations-chart';
import { RecentGenerations } from '@/components/dashboard/recent-generations';
import { QuickActionsCard } from '@/components/dashboard/quick-actions-card';
import { DeleteWorkspaceButton } from './delete-button';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const user = await requireUser();
  const ws = await getWorkspaceForUser(id, user.id);
  return { title: ws ? `${ws.name} — Bannerwright` : 'Workspace — Bannerwright' };
}

export default async function WorkspaceDashboardPage({ params }: Props) {
  const { id } = await params;
  const user = await requireUser();
  const workspace = await getWorkspaceForUser(id, user.id);
  if (!workspace) notFound();

  const [stats, timeseries, recent] = await Promise.all([
    getWorkspaceStats(workspace.id),
    getGenerationsTimeseries({ userId: user.id, workspaceId: workspace.id, days: 30 }),
    getRecentGenerations({ userId: user.id, workspaceId: workspace.id, limit: 6 }),
  ]);

  const countSeries = timeseries.map((p) => p.count);
  const costSeries = timeseries.map((p) => p.costUsd);
  const last7Count = countSeries.slice(-7).reduce((a, b) => a + b, 0);
  const last7Cost = costSeries.slice(-7).reduce((a, b) => a + b, 0);

  const fillerSeries = (n: number) => [
    Math.max(0, n - 4),
    Math.max(0, n - 3),
    Math.max(0, n - 2),
    Math.max(0, n - 1),
    n,
  ];

  const statItems: StatCard[] = [
    {
      title: 'Generations',
      value: stats.generations.toLocaleString(),
      iconKey: 'image',
      gradient: 'from-emerald-500 to-teal-500',
      strokeColor: '#10b981',
      series: countSeries,
      change: `${last7Count} in last 7 days`,
      trend: last7Count > 0 ? 'up' : 'flat',
    },
    {
      title: 'AI cost',
      value: `$${stats.totalCostUsd.toFixed(2)}`,
      iconKey: 'dollar',
      gradient: 'from-blue-500 to-indigo-500',
      strokeColor: '#3b82f6',
      series: costSeries,
      change: `$${last7Cost.toFixed(2)} this week`,
      trend: last7Cost > 0 ? 'up' : 'flat',
    },
    {
      title: 'Knowledge sources',
      value: String(stats.kbSources),
      iconKey: 'database',
      gradient: 'from-violet-500 to-purple-500',
      strokeColor: '#8b5cf6',
      series: fillerSeries(stats.kbSources),
      change: stats.kbSources === 0 ? 'add the brand site' : 'ready for AI',
      trend: 'flat',
    },
    {
      title: 'Templates',
      value: String(stats.templates),
      iconKey: 'template',
      gradient: 'from-rose-500 to-pink-500',
      strokeColor: '#f43f5e',
      series: fillerSeries(stats.templates),
      change: stats.templates === 0 ? 'promote a banner' : 'reusable',
      trend: 'flat',
    },
  ];

  const brand = {
    primary: workspace.brandColors?.primary,
    secondary: workspace.brandColors?.secondary,
    accent: workspace.brandColors?.accent,
    background: workspace.brandColors?.background,
    text: workspace.brandColors?.text,
    headlineFont: workspace.brandFonts?.headline,
    bodyFont: workspace.brandFonts?.body,
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link
            href="/workspaces"
            className="text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            ← All workspaces
          </Link>
          <div className="mt-2 flex items-center gap-3">
            <div
              className="grid size-12 place-items-center rounded-xl text-base font-semibold uppercase text-primary-foreground shadow-sm"
              style={{ background: brand.primary ?? 'var(--color-primary)' }}
            >
              {workspace.name.slice(0, 2)}
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                {workspace.name}
              </h1>
              <p className="text-sm text-muted-foreground">{workspace.slug}</p>
            </div>
          </div>
          {workspace.description && (
            <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
              {workspace.description}
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/workspaces/${workspace.id}/settings`}>
              <SettingsIcon className="size-3.5" />
              Settings
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link href={`/workspaces/${workspace.id}/generations/new`}>
              <Sparkles className="size-3.5" />
              Generate banner
            </Link>
          </Button>
          <DeleteWorkspaceButton id={workspace.id} name={workspace.name} />
        </div>
      </header>

      <StatsCards items={statItems} />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <GenerationsChart
            data={timeseries}
            title="Workshop activity"
            description="Banners and AI cost for this workspace."
          />
          <RecentGenerations rows={recent} showWorkspace={false} />
        </div>
        <div className="space-y-6">
          <QuickActionsCard workspaceId={workspace.id} />
          <BrandSummaryCard
            workspaceId={workspace.id}
            brand={brand}
            logoUrl={workspace.logoUrl}
          />
          <WorkspaceTilesCard workspaceId={workspace.id} />
        </div>
      </div>
    </div>
  );
}

function BrandSummaryCard({
  workspaceId,
  brand,
  logoUrl,
}: {
  workspaceId: string;
  brand: {
    primary?: string;
    secondary?: string;
    accent?: string;
    background?: string;
    text?: string;
    headlineFont?: string;
    bodyFont?: string;
  };
  logoUrl: string | null;
}) {
  const colours = [
    { label: 'Primary', value: brand.primary },
    { label: 'Secondary', value: brand.secondary },
    { label: 'Accent', value: brand.accent },
    { label: 'Background', value: brand.background },
    { label: 'Text', value: brand.text },
  ].filter((c) => Boolean(c.value));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">Brand</CardTitle>
            <CardDescription>The palette and fonts the AI follows.</CardDescription>
          </div>
          <Link
            href={`/workspaces/${workspaceId}/settings`}
            className="text-xs font-medium text-primary hover:underline"
          >
            Edit
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {logoUrl && (
          <div className="rounded-lg border border-border bg-background p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logoUrl} alt="Logo" className="mx-auto h-10 w-auto" />
          </div>
        )}
        {colours.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            No brand colours yet. Set them in Settings or auto-detect from a URL.
          </p>
        ) : (
          <div className="grid grid-cols-5 gap-2">
            {colours.map((c) => (
              <div key={c.label} className="text-center">
                <div
                  className="mx-auto h-8 w-full rounded-md ring-1 ring-border"
                  style={{ background: c.value }}
                />
                <p className="mt-1 text-[10px] font-medium text-muted-foreground">{c.label}</p>
              </div>
            ))}
          </div>
        )}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-md border border-border bg-background p-2">
            <p className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground">
              <Type className="size-3" />
              Headline
            </p>
            <p className="mt-0.5 truncate font-medium text-foreground">
              {brand.headlineFont ?? '—'}
            </p>
          </div>
          <div className="rounded-md border border-border bg-background p-2">
            <p className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground">
              <Palette className="size-3" />
              Body
            </p>
            <p className="mt-0.5 truncate font-medium text-foreground">
              {brand.bodyFont ?? '—'}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function WorkspaceTilesCard({ workspaceId }: { workspaceId: string }) {
  const tiles = [
    { href: `/workspaces/${workspaceId}/generations`, label: 'Generations', badge: 'Banners' },
    { href: `/workspaces/${workspaceId}/knowledge-base`, label: 'Knowledge base', badge: 'Sources' },
    { href: `/workspaces/${workspaceId}/templates`, label: 'Templates', badge: 'Reusable' },
    { href: `/workspaces/${workspaceId}/settings`, label: 'Settings', badge: 'Brand' },
  ];
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Sections</CardTitle>
        <CardDescription>Jump into a workspace area.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-2">
          {tiles.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className="group flex items-center justify-between rounded-lg border border-border px-3 py-2 transition hover:border-primary/40 hover:bg-muted/40"
            >
              <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                {t.label}
                <Badge variant="outline" className="border-border text-[10px] uppercase">
                  {t.badge}
                </Badge>
              </span>
              <ArrowRight className="size-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
