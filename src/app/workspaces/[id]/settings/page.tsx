import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Palette, Settings as SettingsIcon, SwatchBook, Wand2 } from 'lucide-react';
import { requireUser } from '@/lib/auth/current-user';
import { getWorkspaceForUser } from '@/lib/db/queries/workspaces';
import { listKbSourcesByWorkspace } from '@/lib/db/queries/kb';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { HelpHint } from '@/components/ui/help-hint';
import { BrandForm } from './brand-form';
import { AutoDetectButton } from './auto-detect-button';
import { LogoForm } from './logo-form';
import { AppearanceForm } from './appearance-form';
import { DeleteWorkspaceButton } from '../delete-button';

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
    <div className="flex flex-col gap-6">
      <header>
        <Link
          href={`/workspaces/${workspace.id}`}
          className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3" />
          {workspace.name}
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Brand, AI auto-detection, appearance and workspace controls.
        </p>
      </header>

      <Tabs defaultValue="brand" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="brand">
            <SwatchBook className="size-3.5" />
            Brand
          </TabsTrigger>
          <TabsTrigger value="appearance">
            <Palette className="size-3.5" />
            Appearance
          </TabsTrigger>
          <TabsTrigger value="workspace">
            <SettingsIcon className="size-3.5" />
            Workspace
          </TabsTrigger>
        </TabsList>

        <TabsContent value="brand" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="mb-2 grid size-9 place-items-center rounded-lg bg-gradient-to-br from-violet-500 to-purple-500 text-white shadow-sm">
                <Wand2 className="size-4" />
              </div>
              <CardTitle className="flex items-center gap-2 text-base">
                Auto-detect brand
                <HelpHint text="Wysyła screenshoty + treść strony klienta do Gemini 3.1 Pro. Model wyciąga kolory, fonty i ton komunikacji, zapisuje je w workspace. Trwa ~15–30 s, koszt ~$0.01–$0.15." />
              </CardTitle>
              <CardDescription>
                Use Gemini 3.1 Pro to extract brand colours, fonts and tone from your knowledge base.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {readyCount === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Add at least one URL in the{' '}
                  <Link
                    href={`/workspaces/${workspace.id}/knowledge-base`}
                    className="font-medium text-primary underline-offset-2 hover:underline"
                  >
                    knowledge base
                  </Link>{' '}
                  and wait for it to finish processing.
                </p>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">
                    {readyCount} ready source{readyCount === 1 ? '' : 's'} will be analysed.
                  </p>
                  <AutoDetectButton workspaceId={workspace.id} />
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Logo</CardTitle>
              <CardDescription>Used in generated banners and the app nav.</CardDescription>
            </CardHeader>
            <CardContent>
              <LogoForm workspaceId={workspace.id} hasLogo={Boolean(workspace.logoUrl)} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                Brand
                <HelpHint text="Te wartości lecą do każdej generacji jako kontekst (kolor primary jako akcent dominujący, fonty jako Google Fonts). Manualne wpisy nadpisują auto-detect. Pozostaw puste, by AI wybrał neutralne defaulty." />
              </CardTitle>
              <CardDescription>Manual values override auto-detection.</CardDescription>
            </CardHeader>
            <CardContent>
              <BrandForm
                workspaceId={workspace.id}
                key={workspace.updatedAt.toISOString()}
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
        </TabsContent>

        <TabsContent value="appearance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Appearance</CardTitle>
              <CardDescription>Theme and typography for this browser.</CardDescription>
            </CardHeader>
            <CardContent>
              <AppearanceForm />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="workspace" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Workspace info</CardTitle>
              <CardDescription>Read-only summary of this workspace.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm">
              <Field label="Name" value={workspace.name} />
              <Field label="Slug" value={workspace.slug} />
              <Field label="Created" value={new Date(workspace.createdAt).toLocaleString()} />
              <Field label="Last updated" value={new Date(workspace.updatedAt).toLocaleString()} />
            </CardContent>
          </Card>

          <Card className="border-destructive/40">
            <CardHeader>
              <CardTitle className="text-base text-destructive">Danger zone</CardTitle>
              <CardDescription>
                Deletes the workspace, knowledge base, generations and versions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DeleteWorkspaceButton id={workspace.id} name={workspace.name} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-1 gap-1 sm:grid-cols-[140px_1fr] sm:gap-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="font-medium text-foreground">{value}</p>
    </div>
  );
}
