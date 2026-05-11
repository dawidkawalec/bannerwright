import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, History, LayoutTemplate } from 'lucide-react';
import { requireUser } from '@/lib/auth/current-user';
import {
  getGenerationForWorkspace,
  listChatMessages,
  listVersionsByGeneration,
} from '@/lib/db/queries/generations';
import { getWorkspaceForUser } from '@/lib/db/queries/workspaces';
import { EditorShell } from '@/components/editor/editor-shell';
import { TreeEditorShell } from '@/components/editor/tree-editor/tree-editor-shell';
import { Badge } from '@/components/ui/badge';
import { formatLabels } from '@/lib/schemas/generations';
import { DeleteGenerationButton } from './delete-button';
import { TemplateToggle } from './template-toggle';

type Props = { params: Promise<{ id: string; genId: string }> };

export async function generateMetadata({ params }: Props) {
  const { id, genId } = await params;
  const user = await requireUser();
  const workspace = await getWorkspaceForUser(id, user.id);
  if (!workspace) return { title: 'Banner — Bannerwright' };
  const g = await getGenerationForWorkspace(genId, workspace.id);
  return { title: g ? `${g.title} — Bannerwright` : 'Banner — Bannerwright' };
}

export default async function GenerationEditorPage({ params }: Props) {
  const { id, genId } = await params;
  const user = await requireUser();
  const workspace = await getWorkspaceForUser(id, user.id);
  if (!workspace) notFound();
  const generation = await getGenerationForWorkspace(genId, workspace.id);
  if (!generation) notFound();

  const [versions, chat] = await Promise.all([
    listVersionsByGeneration(generation.id),
    listChatMessages(generation.id),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <Link
            href={`/workspaces/${workspace.id}/generations`}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-3" />
            Generations
          </Link>
          <h1 className="mt-2 truncate text-2xl font-semibold tracking-tight text-foreground">
            {generation.title}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="border-primary/30 text-primary">
              {formatLabels[generation.format]}
            </Badge>
            <Badge variant="secondary" className="gap-1">
              <History className="size-3" />
              {versions.length} version{versions.length === 1 ? '' : 's'}
            </Badge>
            {generation.isTemplate && (
              <Badge className="bg-amber-500 text-amber-50">
                <LayoutTemplate className="size-3" />
                Template
              </Badge>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-start gap-2">
          <TemplateToggle
            workspaceId={workspace.id}
            generationId={generation.id}
            isTemplate={generation.isTemplate}
            templateName={generation.templateName}
            defaultName={generation.title}
          />
          <DeleteGenerationButton workspaceId={workspace.id} id={generation.id} />
        </div>
      </header>

      {generation.currentTree ? (
        <TreeEditorShell
          workspaceId={workspace.id}
          generationId={generation.id}
          initialTree={generation.currentTree}
        />
      ) : (
        <EditorShell
          workspaceId={workspace.id}
          generationId={generation.id}
          format={generation.format}
          initialHtml={generation.currentHtml ?? ''}
          initialChat={chat.map((m) => ({
            id: m.id,
            role: m.role,
            content: m.content,
            createdAt: m.createdAt.toISOString(),
          }))}
          initialVersions={versions.map((v) => ({
            id: v.id,
            versionNumber: v.versionNumber,
            triggeredBy: v.triggeredBy,
            createdAt: v.createdAt.toISOString(),
          }))}
        />
      )}
    </div>
  );
}
