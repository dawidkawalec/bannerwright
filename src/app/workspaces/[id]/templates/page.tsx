import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Image as ImageIcon, LayoutTemplate } from 'lucide-react';
import { requireUser } from '@/lib/auth/current-user';
import { getWorkspaceForUser } from '@/lib/db/queries/workspaces';
import { listTemplatesByWorkspace } from '@/lib/db/queries/generations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link
            href={`/workspaces/${workspace.id}`}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-3" />
            {workspace.name}
          </Link>
          <h1 className="mt-2 flex items-center gap-2 text-2xl font-semibold tracking-tight text-foreground">
            Templates
            <Badge className="bg-amber-500 text-amber-50">{templates.length}</Badge>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Banners promoted as reusable starting points.
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href={`/workspaces/${workspace.id}/generations`}>
            <ImageIcon className="size-3.5" />
            All generations
          </Link>
        </Button>
      </header>

      {templates.length === 0 ? (
        <Card>
          <CardContent className="grid place-items-center gap-3 py-12 text-center">
            <div className="grid size-12 place-items-center rounded-full bg-amber-500/10 text-amber-600">
              <LayoutTemplate className="size-6" />
            </div>
            <div>
              <p className="text-base font-medium text-foreground">No templates yet</p>
              <p className="text-sm text-muted-foreground">
                Open a great banner and click &quot;Promote to template&quot; — it lives here for reuse.
              </p>
            </div>
            <Button asChild size="sm">
              <Link href={`/workspaces/${workspace.id}/generations`}>Browse banners</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {templates.map((t) => (
            <Card
              key={t.id}
              className="group flex h-full flex-col overflow-hidden border-border/60 transition-all hover:-translate-y-0.5 hover:border-amber-500/40 hover:shadow-md"
            >
              <Link
                href={`/workspaces/${workspace.id}/generations/${t.id}`}
                className="relative block aspect-square overflow-hidden bg-gradient-to-br from-amber-100/40 to-muted/30"
              >
                {t.currentPngPath ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={`/api/generations/${t.id}/png`}
                    alt={t.title}
                    className="size-full object-contain transition-transform duration-300 group-hover:scale-[1.03]"
                  />
                ) : (
                  <div className="grid size-full place-items-center text-muted-foreground">
                    <ImageIcon className="size-8 opacity-30" />
                  </div>
                )}
                <Badge className="absolute left-2 top-2 bg-amber-500 text-amber-50">
                  <LayoutTemplate className="size-3" />
                  Template
                </Badge>
              </Link>
              <CardHeader className="pb-3">
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
                  className="text-xs font-medium text-muted-foreground hover:text-foreground"
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
