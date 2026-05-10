import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireUser } from '@/lib/auth/current-user';
import {
  getGenerationForWorkspace,
  listVersionsByGeneration,
} from '@/lib/db/queries/generations';
import { getWorkspaceForUser } from '@/lib/db/queries/workspaces';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { BannerPreview } from '@/components/banner-preview';
import { formatLabels } from '@/lib/schemas/generations';
import { DeleteGenerationButton } from './delete-button';

type Props = { params: Promise<{ id: string; genId: string }> };

export async function generateMetadata({ params }: Props) {
  const { id, genId } = await params;
  const user = await requireUser();
  const workspace = await getWorkspaceForUser(id, user.id);
  if (!workspace) return { title: 'Banner — Bannerwright' };
  const g = await getGenerationForWorkspace(genId, workspace.id);
  return { title: g ? `${g.title} — Bannerwright` : 'Banner — Bannerwright' };
}

export default async function GenerationDetailPage({ params }: Props) {
  const { id, genId } = await params;
  const user = await requireUser();
  const workspace = await getWorkspaceForUser(id, user.id);
  if (!workspace) notFound();
  const generation = await getGenerationForWorkspace(genId, workspace.id);
  if (!generation) notFound();

  const versions = await listVersionsByGeneration(generation.id);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <Link
            href={`/workspaces/${workspace.id}/generations`}
            className="text-sm text-slate-500 hover:text-slate-900"
          >
            ← Generations
          </Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
            {generation.title}
          </h1>
          <p className="text-sm text-slate-500">{formatLabels[generation.format]}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <a
            href={`/api/generations/${generation.id}/png`}
            download={`${generation.title}.png`}
            className={cn(buttonVariants({ size: 'sm' }))}
          >
            Download PNG
          </a>
          <DeleteGenerationButton workspaceId={workspace.id} id={generation.id} />
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <BannerPreview html={generation.currentHtml} format={generation.format} />

        <div className="flex flex-col gap-4">
          {generation.brief && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Brief</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm text-slate-600">
                  {generation.brief}
                </p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Versions</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="flex flex-col gap-2 text-sm text-slate-600">
                {versions.map((v) => (
                  <li
                    key={v.id}
                    className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2"
                  >
                    <span>v{v.versionNumber}</span>
                    <span className="text-xs uppercase tracking-wide text-slate-500">
                      {v.triggeredBy}
                    </span>
                  </li>
                ))}
              </ol>
              <p className="mt-3 text-xs text-slate-500">
                The full Monaco + AI chat editor lands in Faza 3.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
