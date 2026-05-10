import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireUser } from '@/lib/auth/current-user';
import { getWorkspaceForUser } from '@/lib/db/queries/workspaces';
import { listKbSourcesByWorkspace } from '@/lib/db/queries/kb';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { HelpHint } from '@/components/ui/help-hint';
import { AddKbUrlForm } from './add-url-form';
import { AddKbTextForm } from './add-text-form';
import { AddKbUploadForm } from './add-upload-form';
import { KbSourceRow } from './kb-source-row';

type Props = { params: Promise<{ id: string }> };

export const metadata = { title: 'Knowledge base — Bannerwright' };

export default async function KnowledgeBasePage({ params }: Props) {
  const { id } = await params;
  const user = await requireUser();
  const workspace = await getWorkspaceForUser(id, user.id);
  if (!workspace) notFound();
  const sources = await listKbSourcesByWorkspace(workspace.id);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <Link
          href={`/workspaces/${workspace.id}`}
          className="text-sm text-slate-700 hover:text-slate-900"
        >
          ← {workspace.name}
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
          Knowledge base
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-700">
          Add the client&apos;s website. Bannerwright opens it in a real browser, screenshots
          the page, and extracts the text. The AI uses this context when generating banners.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Add URL
              <HelpHint text="Wkleja link do strony klienta. Bannerwright otwiera ją w prawdziwej przeglądarce, robi pełnostronicowy screenshot i wyciąga tekst — AI używa tego jako kontekstu brandowego." />
            </CardTitle>
            <CardDescription>Public http(s) URL — scraped + screenshotted.</CardDescription>
          </CardHeader>
          <CardContent>
            <AddKbUrlForm workspaceId={workspace.id} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Upload file
              <HelpHint text="Tekst (TXT/MD) jest wczytywany do bazy wiedzy bezpośrednio. Obrazy (PNG/JPEG/WebP) są zapisywane jako załączniki i automatycznie dołączane do promptów multimodalnych. PDF wkrótce." />
            </CardTitle>
            <CardDescription>TXT, MD, PNG, JPEG, WebP. PDF coming soon.</CardDescription>
          </CardHeader>
          <CardContent>
            <AddKbUploadForm workspaceId={workspace.id} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Add notes
              <HelpHint text="Krótkie notatki tekstowe — ton brandu, persona klienta, kluczowe komunikaty. AI ma to w prompcie przy każdej generacji." />
            </CardTitle>
            <CardDescription>Free-form brand voice, audience, positioning.</CardDescription>
          </CardHeader>
          <CardContent>
            <AddKbTextForm workspaceId={workspace.id} />
          </CardContent>
        </Card>
      </div>

      {sources.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-sm text-slate-700">No sources yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sources.map((s) => (
            <KbSourceRow key={s.id} source={s} workspaceId={workspace.id} />
          ))}
        </div>
      )}
    </div>
  );
}
