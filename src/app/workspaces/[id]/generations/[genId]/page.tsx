import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireUser } from '@/lib/auth/current-user';
import {
  getGenerationForWorkspace,
  listChatMessages,
  listVersionsByGeneration,
} from '@/lib/db/queries/generations';
import { getWorkspaceForUser } from '@/lib/db/queries/workspaces';
import { EditorShell } from '@/components/editor/editor-shell';
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
      <header className="flex items-start justify-between gap-4">
        <div>
          <Link
            href={`/workspaces/${workspace.id}/generations`}
            className="text-sm text-slate-500 hover:text-slate-900"
          >
            ← Generations
          </Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
            {generation.title}
          </h1>
          <p className="text-sm text-slate-500">{formatLabels[generation.format]}</p>
        </div>
        <div className="flex flex-wrap items-start gap-3">
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

      <EditorShell
        workspaceId={workspace.id}
        generationId={generation.id}
        format={generation.format}
        initialHtml={generation.currentHtml}
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
    </div>
  );
}
