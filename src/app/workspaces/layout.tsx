import { requireUser } from '@/lib/auth/current-user';
import { listWorkspacesByUser } from '@/lib/db/queries/workspaces';
import { getHeaderNotifications } from '@/lib/db/queries/notifications';
import { AppShell } from '@/components/layout/app-shell';

export default async function WorkspacesLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const [workspaces, notifications] = await Promise.all([
    listWorkspacesByUser(user.id),
    getHeaderNotifications(user.id),
  ]);
  const mini = workspaces.map((w) => ({ id: w.id, name: w.name, slug: w.slug }));
  return (
    <AppShell email={user.email} workspaces={mini} notifications={notifications}>
      {children}
    </AppShell>
  );
}
