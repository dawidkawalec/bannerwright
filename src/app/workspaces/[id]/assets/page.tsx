import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ImageOff } from 'lucide-react';
import { requireUser } from '@/lib/auth/current-user';
import { getWorkspaceForUser } from '@/lib/db/queries/workspaces';
import { listGeneratedAssets } from '@/app/actions/workspaces';
import { AssetCard } from './asset-card';

type Props = { params: Promise<{ id: string }> };

export const metadata = { title: 'Assets — Bannerwright' };

export default async function AssetsPage({ params }: Props) {
  const { id } = await params;
  const user = await requireUser();
  const workspace = await getWorkspaceForUser(id, user.id);
  if (!workspace) notFound();

  const res = await listGeneratedAssets(workspace.id);
  const assets = res.ok ? res.data : [];

  return (
    <div className="flex flex-col gap-6">
      <header>
        <Link
          href={`/workspaces/${workspace.id}`}
          className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3" />
          {workspace.name}
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">Generated assets</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Backgrounds and other AI-generated images for this workspace. Re-use them across banners.
        </p>
      </header>

      {assets.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border bg-card py-16 text-center">
          <ImageOff className="size-8 text-muted-foreground" />
          <p className="text-sm font-medium text-foreground">No generated images yet</p>
          <p className="max-w-md text-xs text-muted-foreground">
            Open any banner, click <span className="font-medium">Generate background</span> in the editor, and the
            Nano Banana output will show up here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {assets.map((asset) => (
            <AssetCard
              key={asset.name}
              workspaceId={workspace.id}
              name={asset.name}
              size={asset.size}
              createdAt={asset.createdAt}
            />
          ))}
        </div>
      )}
    </div>
  );
}
