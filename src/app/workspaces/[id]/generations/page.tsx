import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireUser } from '@/lib/auth/current-user';
import { getWorkspaceForUser } from '@/lib/db/queries/workspaces';
import { listGenerationsByWorkspace } from '@/lib/db/queries/generations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatLabels } from '@/lib/schemas/generations';

type Props = { params: Promise<{ id: string }> };

export const metadata = { title: 'Generations — Bannerwright' };

export default async function GenerationsPage({ params }: Props) {
  const { id } = await params;
  const user = await requireUser();
  const workspace = await getWorkspaceForUser(id, user.id);
  if (!workspace) notFound();
  const generations = await listGenerationsByWorkspace(workspace.id);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-end justify-between">
        <div>
          <Link
            href={`/workspaces/${workspace.id}`}
            className="text-sm text-slate-600 hover:text-slate-900"
          >
            ← {workspace.name}
          </Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
            Generations
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Banners produced from briefs.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/workspaces/${workspace.id}/templates`}
            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
          >
            Templates
          </Link>
          <Link
            href={`/workspaces/${workspace.id}/generations/new`}
            className={cn(buttonVariants({ size: 'sm' }))}
          >
            New banner
          </Link>
        </div>
      </header>

      {generations.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-sm text-slate-600">
              No generations yet — create the first banner.
            </p>
            <Link
              href={`/workspaces/${workspace.id}/generations/new`}
              className={cn(buttonVariants({ size: 'sm' }), 'mt-4')}
            >
              New banner
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {generations.map((g) => (
            <Link
              key={g.id}
              href={`/workspaces/${workspace.id}/generations/${g.id}`}
              className="block transition-shadow hover:shadow-md"
            >
              <Card className="h-full overflow-hidden">
                <div className="aspect-[1/1] overflow-hidden bg-slate-50">
                  {g.currentPngPath ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={`/api/generations/${g.id}/png`}
                      alt={g.title}
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-slate-500">
                      No PNG yet
                    </div>
                  )}
                </div>
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="line-clamp-2 text-sm">{g.title}</CardTitle>
                    {g.isTemplate && (
                      <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                        Template
                      </span>
                    )}
                  </div>
                  <CardDescription className="text-xs">
                    {formatLabels[g.format]}
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
