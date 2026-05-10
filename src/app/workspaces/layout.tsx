import { requireUser } from '@/lib/auth/current-user';
import { listWorkspacesByUser } from '@/lib/db/queries/workspaces';
import { AppShell } from '@/components/layout/app-shell';

export default async function WorkspacesLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const workspaces = await listWorkspacesByUser(user.id);
  const mini = workspaces.map((w) => ({ id: w.id, name: w.name, slug: w.slug }));
  return (
    <AppShell email={user.email} workspaces={mini}>
      {children}
    </AppShell>
  );
}
