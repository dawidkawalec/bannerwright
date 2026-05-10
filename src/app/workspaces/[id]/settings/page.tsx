import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireUser } from '@/lib/auth/current-user';
import { getWorkspaceForUser } from '@/lib/db/queries/workspaces';
import { listKbSourcesByWorkspace } from '@/lib/db/queries/kb';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BrandForm } from './brand-form';
import { AutoDetectButton } from './auto-detect-button';
import { LogoForm } from './logo-form';

type Props = { params: Promise<{ id: string }> };

export const metadata = { title: 'Settings — Bannerwright' };

export default async function SettingsPage({ params }: Props) {
  const { id } = await params;
  const user = await requireUser();
  const workspace = await getWorkspaceForUser(id, user.id);
  if (!workspace) notFound();

  const sources = await listKbSourcesByWorkspace(workspace.id);
  const readyCount = sources.filter((s) => s.status === 'ready').length;

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <header>
        <Link
          href={`/workspaces/${workspace.id}`}
          className="text-sm text-slate-500 hover:text-slate-900"
        >
          ← {workspace.name}
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">Settings</h1>
        <p className="mt-1 text-sm text-slate-600">
          Brand colours, fonts and AI auto-detection.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Auto-detect brand</CardTitle>
          <CardDescription>
            Use Gemini 3.1 Pro to extract brand colours, fonts and tone from your knowledge
            base.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {readyCount === 0 ? (
            <p className="text-sm text-slate-500">
              Add at least one URL in the{' '}
              <Link
                href={`/workspaces/${workspace.id}/knowledge-base`}
                className="underline hover:text-slate-900"
              >
                knowledge base
              </Link>{' '}
              and wait for it to finish processing.
            </p>
          ) : (
            <>
              <p className="text-sm text-slate-500">
                {readyCount} ready source{readyCount === 1 ? '' : 's'} will be analysed.
              </p>
              <AutoDetectButton workspaceId={workspace.id} />
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Logo</CardTitle>
          <CardDescription>Used in generated banners and the app nav.</CardDescription>
        </CardHeader>
        <CardContent>
          <LogoForm workspaceId={workspace.id} hasLogo={Boolean(workspace.logoUrl)} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Brand</CardTitle>
          <CardDescription>Manual values override auto-detection.</CardDescription>
        </CardHeader>
        <CardContent>
          <BrandForm
            workspaceId={workspace.id}
            initial={{
              primary: workspace.brandColors?.primary ?? '',
              secondary: workspace.brandColors?.secondary ?? '',
              accent: workspace.brandColors?.accent ?? '',
              background: workspace.brandColors?.background ?? '',
              text: workspace.brandColors?.text ?? '',
              headlineFont: workspace.brandFonts?.headline ?? '',
              bodyFont: workspace.brandFonts?.body ?? '',
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
