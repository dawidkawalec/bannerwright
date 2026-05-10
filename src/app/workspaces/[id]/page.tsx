import { notFound } from 'next/navigation';
import Link from 'next/link';
import { requireUser } from '@/lib/auth/current-user';
import { getWorkspaceForUser } from '@/lib/db/queries/workspaces';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <Link href="/workspaces" className="text-sm text-slate-600 hover:text-slate-900">
            ← All workspaces
          </Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
            {workspace.name}
          </h1>
          {workspace.description && (
            <p className="mt-1 max-w-2xl text-sm text-slate-600">{workspace.description}</p>
          )}
        </div>
        <DeleteWorkspaceButton id={workspace.id} name={workspace.name} />
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          href={`/workspaces/${workspace.id}/knowledge-base`}
          className="block transition-shadow hover:shadow-md"
        >
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Knowledge base →</CardTitle>
              <CardDescription>URLs, uploads, brand context</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600">
                Add the client&apos;s site so the AI knows the brand.
              </p>
            </CardContent>
          </Card>
        </Link>
        <Link
          href={`/workspaces/${workspace.id}/generations`}
          className="block transition-shadow hover:shadow-md"
        >
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Generations →</CardTitle>
              <CardDescription>Banners produced from briefs</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600">
                Brief + brand context → HTML + PNG in ~30 s.
              </p>
            </CardContent>
          </Card>
        </Link>
        <Link
          href={`/workspaces/${workspace.id}/settings`}
          className="block transition-shadow hover:shadow-md"
        >
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Settings →</CardTitle>
              <CardDescription>Brand colours, fonts, auto-detect</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600">
                Tune the brand the AI uses when generating banners.
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
