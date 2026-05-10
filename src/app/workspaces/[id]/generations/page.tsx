import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  ArrowUpRight,
  DollarSign,
  Image as ImageIcon,
  LayoutTemplate,
  Sparkles,
} from 'lucide-react';
import { requireUser } from '@/lib/auth/current-user';
import { getWorkspaceForUser } from '@/lib/db/queries/workspaces';
import { listGenerationsByWorkspace } from '@/lib/db/queries/generations';
import { getWorkspaceStats } from '@/lib/db/queries/stats';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatLabels } from '@/lib/schemas/generations';

type Props = { params: Promise<{ id: string }> };

export const metadata = { title: 'Generations — Bannerwright' };

export default async function GenerationsPage({ params }: Props) {
  const { id } = await params;
  const user = await requireUser();
  const workspace = await getWorkspaceForUser(id, user.id);
  if (!workspace) notFound();
  const [generations, stats] = await Promise.all([
    listGenerationsByWorkspace(workspace.id),
    getWorkspaceStats(workspace.id),
  ]);

  const avgCost = stats.generations > 0 ? stats.totalCostUsd / stats.generations : 0;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link
            href={`/workspaces/${workspace.id}`}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-3" />
            {workspace.name}
          </Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
            Generations
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Banners produced from briefs · {generations.length} total
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/workspaces/${workspace.id}/templates`}>
              <LayoutTemplate className="size-3.5" />
              Templates
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link href={`/workspaces/${workspace.id}/generations/new`}>
              <Sparkles className="size-3.5" />
              New banner
            </Link>
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SmallStat
          icon={ImageIcon}
          label="Total generations"
          value={String(stats.generations)}
          color="from-emerald-500 to-teal-500"
        />
        <SmallStat
          icon={DollarSign}
          label="Total spent"
          value={`$${stats.totalCostUsd.toFixed(2)}`}
          color="from-blue-500 to-indigo-500"
        />
        <SmallStat
          icon={Sparkles}
          label="Avg cost / banner"
          value={`$${avgCost.toFixed(4)}`}
          color="from-violet-500 to-purple-500"
        />
      </div>

      {generations.length === 0 ? (
        <Card>
          <CardContent className="grid place-items-center gap-3 py-12 text-center">
            <div className="grid size-12 place-items-center rounded-full bg-primary/10 text-primary">
              <Sparkles className="size-6" />
            </div>
            <div>
              <p className="text-base font-medium text-foreground">No banners yet</p>
              <p className="text-sm text-muted-foreground">
                Drop a brief and let the AI craft the first version.
              </p>
            </div>
            <Button asChild size="sm">
              <Link href={`/workspaces/${workspace.id}/generations/new`}>
                <Sparkles className="size-3.5" />
                Generate first banner
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {generations.map((g) => (
            <Link
              key={g.id}
              href={`/workspaces/${workspace.id}/generations/${g.id}`}
              className="group"
            >
              <Card className="h-full overflow-hidden border-border/60 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md">
                <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-muted/60 to-muted/20">
                  {g.currentPngPath ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={`/api/generations/${g.id}/png`}
                      alt={g.title}
                      className="size-full object-contain transition-transform duration-300 group-hover:scale-[1.03]"
                    />
                  ) : (
                    <div className="grid size-full place-items-center text-xs text-muted-foreground">
                      <ImageIcon className="size-8 opacity-30" />
                    </div>
                  )}
                  <div className="absolute left-2 top-2 flex flex-wrap gap-1">
                    <Badge variant="secondary" className="bg-background/90 text-foreground">
                      {formatLabels[g.format]}
                    </Badge>
                    {g.isTemplate && (
                      <Badge className="bg-amber-500 text-amber-50">Template</Badge>
                    )}
                  </div>
                </div>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-1 text-sm">
                    <span className="line-clamp-1 flex-1">{g.title}</span>
                    <ArrowUpRight className="size-3.5 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
                  </CardTitle>
                  <CardDescription className="text-[11px]">
                    {new Date(g.updatedAt).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function SmallStat({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: typeof ImageIcon;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div
          className={`grid size-10 place-items-center rounded-lg bg-gradient-to-br text-white shadow-sm ${color}`}
        >
          <Icon className="size-4" />
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p className="text-lg font-semibold text-foreground">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
