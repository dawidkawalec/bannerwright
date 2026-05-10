import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireUser } from '@/lib/auth/current-user';
import { getWorkspaceForUser } from '@/lib/db/queries/workspaces';
import { listKbSourcesByWorkspace } from '@/lib/db/queries/kb';
import { GenerateFlow } from './generate-flow';

type Props = { params: Promise<{ id: string }> };

export const metadata = { title: 'New banner — Bannerwright' };

export default async function NewGenerationPage({ params }: Props) {
  const { id } = await params;
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
        className="text-sm text-slate-500 hover:text-slate-900"
      >
        ← Generations
      </Link>
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">New banner</h1>
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
      />
    </div>
  );
}
