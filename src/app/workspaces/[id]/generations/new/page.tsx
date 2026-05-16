import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireUser } from '@/lib/auth/current-user';
import { getWorkspaceForUser } from '@/lib/db/queries/workspaces';
import { listKbSourcesByWorkspace } from '@/lib/db/queries/kb';
import { GenerateFlow } from './generate-flow';

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ brief?: string; title?: string }>;
};

export const metadata = { title: 'New banner — Bannerwright' };

export default async function NewGenerationPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { brief: prefilledBrief, title: prefilledTitle } = await searchParams;
  const user = await requireUser();
  const workspace = await getWorkspaceForUser(id, user.id);
  if (!workspace) notFound();

  const sources = await listKbSourcesByWorkspace(workspace.id);
  const readyCount = sources.filter((s) => s.status === 'ready').length;
  const hasBrand = Boolean(workspace.brandColors?.primary);

  return (
    <div className="flex flex-col gap-4">
      <Link
        href={`/workspaces/${workspace.id}/generations`}
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← Generations
      </Link>
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">New banner</h1>
      {!hasBrand && (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          No brand colour set yet. The AI will pick reasonable defaults — for branded output
          add KB sources and{' '}
          <Link
            href={`/workspaces/${workspace.id}/settings`}
            className="underline"
          >
            auto-detect the brand
          </Link>
          .
        </p>
      )}
      <GenerateFlow
        workspaceId={workspace.id}
        readyKbCount={readyCount}
        hasBrand={hasBrand}
        brandColors={workspace.brandColors}
        brandFonts={workspace.brandFonts}
        initialBrief={prefilledBrief?.slice(0, 2000) ?? ''}
        initialTitle={prefilledTitle?.slice(0, 120) ?? ''}
      />
    </div>
  );
}
