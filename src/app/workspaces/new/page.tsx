import Link from 'next/link';
import { requireUser } from '@/lib/auth/current-user';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CreateWorkspaceForm } from './create-form';

export const metadata = { title: 'New workspace — Bannerwright' };

export default async function NewWorkspacePage() {
  await requireUser();
  return (
    <div className="mx-auto max-w-xl">
      <Link href="/workspaces" className="text-sm text-slate-500 hover:text-slate-900">
        ← Back to workspaces
      </Link>
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Create workspace</CardTitle>
        </CardHeader>
        <CardContent>
          <CreateWorkspaceForm />
        </CardContent>
      </Card>
    </div>
  );
}
