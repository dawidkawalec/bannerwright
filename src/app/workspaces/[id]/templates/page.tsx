import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireUser } from '@/lib/auth/current-user';
import { getWorkspaceForUser } from '@/lib/db/queries/workspaces';
import { listTemplatesByWorkspace } from '@/lib/db/queries/generations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatLabels } from '@/lib/schemas/generations';
import { UseTemplateButton } from './use-template-button';

type Props = { params: Promise<{ id: string }> };

export const metadata = { title: 'Templates — Bannerwright' };

export default async function TemplatesPage({ params }: Props) {
  const { id } = await params;
  const user = await requireUser();
  const workspace = await getWorkspaceForUser(id, user.id);
  if (!workspace) notFound();
  const templates = await listTemplatesByWorkspace(workspace.id);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <Link
          href={`/workspaces/${workspace.id}`}
          className="text-sm text-slate-500 hover:text-slate-900"
        >
          ← {workspace.name}
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">Templates</h1>
        <p className="mt-1 text-sm text-slate-600">
          Banners promoted as reusable starting points.
        </p>
      </header>

      {templates.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-slate-500">
            No templates yet. Open any generation and click &quot;Promote to template&quot;.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((t) => (
            <Card key={t.id} className="flex flex-col overflow-hidden">
              <Link
                href={`/workspaces/${workspace.id}/generations/${t.id}`}
                className="block aspect-[1/1] overflow-hidden bg-slate-50"
              >
                {t.currentPngPath ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={`/api/generations/${t.id}/png`}
                    alt={t.title}
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-slate-400">
                    No PNG yet
                  </div>
                )}
              </Link>
              <CardHeader>
                <CardTitle className="line-clamp-1 text-sm">
                  {t.templateName ?? t.title}
                </CardTitle>
                <CardDescription className="text-xs">
                  {formatLabels[t.format]}
                </CardDescription>
              </CardHeader>
              <CardContent className="mt-auto flex items-center justify-between gap-2 pt-0">
                <Link
                  href={`/workspaces/${workspace.id}/generations/${t.id}`}
                  className="text-xs text-slate-500 underline hover:text-slate-900"
                >
                  Open
                </Link>
                <UseTemplateButton workspaceId={workspace.id} templateId={t.id} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
