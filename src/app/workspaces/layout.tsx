import { requireUser } from '@/lib/auth/current-user';
import { listWorkspacesByUser } from '@/lib/db/queries/workspaces';
import { AppNav } from '@/components/app-nav';

export default async function WorkspacesLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const workspaces = await listWorkspacesByUser(user.id);

  return (
    <div className="min-h-screen bg-slate-50">
      <AppNav email={user.email} workspaces={workspaces} />
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
