import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Database,
  FileText,
  Globe,
  Loader2,
  Type,
  Upload,
  XCircle,
} from 'lucide-react';
import { requireUser } from '@/lib/auth/current-user';
import { getWorkspaceForUser } from '@/lib/db/queries/workspaces';
import { listKbSourcesByWorkspace } from '@/lib/db/queries/kb';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { HelpHint } from '@/components/ui/help-hint';
import { Badge } from '@/components/ui/badge';
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

  const counts = {
    total: sources.length,
    url: sources.filter((s) => s.sourceType === 'url').length,
    upload: sources.filter((s) => s.sourceType === 'upload').length,
    text: sources.filter((s) => s.sourceType === 'text').length,
    ready: sources.filter((s) => s.status === 'ready').length,
    pending: sources.filter((s) => s.status === 'pending' || s.status === 'processing').length,
    failed: sources.filter((s) => s.status === 'failed').length,
  };

  return (
    <div className="flex flex-col gap-6">
      <header>
        <Link
          href={`/workspaces/${workspace.id}`}
          className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3" />
          {workspace.name}
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
          Knowledge base
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Add the client&apos;s website. Bannerwright opens it in a real browser, screenshots
          the page, and extracts the text. The AI uses this context when generating banners.
        </p>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <KbStat icon={Database} label="Total" value={counts.total} accent="from-emerald-500 to-teal-500" />
        <KbStat icon={CheckCircle2} label="Ready" value={counts.ready} accent="from-blue-500 to-indigo-500" tone="ok" />
        <KbStat icon={Loader2} label="Processing" value={counts.pending} accent="from-amber-500 to-orange-500" tone="warn" />
        <KbStat icon={XCircle} label="Failed" value={counts.failed} accent="from-rose-500 to-pink-500" tone="bad" />
      </div>

      {/* Add forms */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="overflow-hidden">
          <div className="absolute right-0 top-0 -mr-8 -mt-8 size-24 rounded-full bg-blue-500/10" />
          <CardHeader className="relative">
            <div className="mb-2 grid size-9 place-items-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 text-white shadow-sm">
              <Globe className="size-4" />
            </div>
            <CardTitle className="flex items-center gap-2 text-base">
              Add URL
              <HelpHint text="Wkleja link do strony klienta. Bannerwright otwiera ją w prawdziwej przeglądarce, robi pełnostronicowy screenshot i wyciąga tekst — AI używa tego jako kontekstu brandowego." />
            </CardTitle>
            <CardDescription>Public http(s) URL — scraped + screenshotted.</CardDescription>
          </CardHeader>
          <CardContent>
            <AddKbUrlForm workspaceId={workspace.id} />
          </CardContent>
        </Card>
        <Card className="overflow-hidden">
          <div className="absolute right-0 top-0 -mr-8 -mt-8 size-24 rounded-full bg-violet-500/10" />
          <CardHeader className="relative">
            <div className="mb-2 grid size-9 place-items-center rounded-lg bg-gradient-to-br from-violet-500 to-purple-500 text-white shadow-sm">
              <Upload className="size-4" />
            </div>
            <CardTitle className="flex items-center gap-2 text-base">
              Upload file
              <HelpHint text="Tekst (TXT/MD) jest wczytywany do bazy wiedzy bezpośrednio. Obrazy (PNG/JPEG/WebP) są zapisywane jako załączniki i automatycznie dołączane do promptów multimodalnych. PDF wkrótce." />
            </CardTitle>
            <CardDescription>TXT, MD, PNG, JPEG, WebP. PDF coming soon.</CardDescription>
          </CardHeader>
          <CardContent>
            <AddKbUploadForm workspaceId={workspace.id} />
          </CardContent>
        </Card>
        <Card className="overflow-hidden">
          <div className="absolute right-0 top-0 -mr-8 -mt-8 size-24 rounded-full bg-emerald-500/10" />
          <CardHeader className="relative">
            <div className="mb-2 grid size-9 place-items-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-sm">
              <Type className="size-4" />
            </div>
            <CardTitle className="flex items-center gap-2 text-base">
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

      {/* Sources */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Sources</h2>
            <p className="text-sm text-muted-foreground">
              {counts.total} item{counts.total === 1 ? '' : 's'} ·{' '}
              <span className="inline-flex items-center gap-1">
                <Globe className="size-3" /> {counts.url}
              </span>
              <span className="mx-1">·</span>
              <span className="inline-flex items-center gap-1">
                <FileText className="size-3" /> {counts.upload}
              </span>
              <span className="mx-1">·</span>
              <span className="inline-flex items-center gap-1">
                <Type className="size-3" /> {counts.text}
              </span>
            </p>
          </div>
          {sources.length > 0 && (
            <Badge variant="outline" className="gap-1">
              <Clock className="size-3" />
              {counts.pending} processing
            </Badge>
          )}
        </div>
        {sources.length === 0 ? (
          <Card>
            <CardContent className="grid place-items-center gap-2 py-12 text-center">
              <div className="grid size-12 place-items-center rounded-full bg-primary/10 text-primary">
                <Database className="size-6" />
              </div>
              <p className="text-base font-medium text-foreground">No sources yet</p>
              <p className="text-sm text-muted-foreground">
                Drop a URL, file, or note above to seed the brand context.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sources.map((s) => (
              <KbSourceRow key={s.id} source={s} workspaceId={workspace.id} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function KbStat({
  icon: Icon,
  label,
  value,
  accent,
  tone,
}: {
  icon: typeof Database;
  label: string;
  value: number;
  accent: string;
  tone?: 'ok' | 'warn' | 'bad';
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div
          className={`grid size-10 place-items-center rounded-lg bg-gradient-to-br text-white shadow-sm ${accent}`}
        >
          <Icon className="size-4" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p className="text-lg font-semibold text-foreground">
            {value}
            {tone && (
              <span className="ml-2 align-middle">
                {tone === 'ok' && <CheckCircle2 className="inline size-3.5 text-emerald-500" />}
                {tone === 'warn' && <Loader2 className="inline size-3.5 animate-spin text-amber-500" />}
                {tone === 'bad' && value > 0 && <XCircle className="inline size-3.5 text-rose-500" />}
              </span>
            )}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
