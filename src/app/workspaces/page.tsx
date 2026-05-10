import Link from 'next/link';
import { requireUser } from '@/lib/auth/current-user';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { buttonVariants } from '@/components/ui/button';
import { listWorkspacesByUser } from '@/lib/db/queries/workspaces';
import { cn } from '@/lib/utils';

export const metadata = { title: 'Workspaces — Bannerwright' };

export default async function WorkspacesPage() {
  const user = await requireUser();
  const workspaces = await listWorkspacesByUser(user.id);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Workspaces</h1>
          <p className="text-sm text-slate-500">
            Each workspace is one brand client.
          </p>
        </div>
        <Link href="/workspaces/new" className={cn(buttonVariants({ size: 'sm' }))}>
          New workspace
        </Link>
      </header>

      {workspaces.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-sm text-slate-500">No workspaces yet.</p>
            <Link
              href="/workspaces/new"
              className={cn(buttonVariants({ size: 'sm' }), 'mt-4')}
            >
              Create your first workspace
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {workspaces.map((w) => (
            <Link key={w.id} href={`/workspaces/${w.id}`} className="block">
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardHeader>
                  <CardTitle>{w.name}</CardTitle>
                  <CardDescription>{w.slug}</CardDescription>
                </CardHeader>
                {w.description && (
                  <CardContent>
                    <p className="line-clamp-3 text-sm text-slate-600">{w.description}</p>
                  </CardContent>
                )}
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
