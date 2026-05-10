import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Database, Image as ImageIcon, Settings as SettingsIcon } from 'lucide-react';
import { requireUser } from '@/lib/auth/current-user';
import { getWorkspaceForUser } from '@/lib/db/queries/workspaces';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DeleteWorkspaceButton } from './delete-button';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const user = await requireUser();
  const ws = await getWorkspaceForUser(id, user.id);
  return { title: ws ? `${ws.name} — Bannerwright` : 'Workspace — Bannerwright' };
}

export default async function WorkspaceDashboardPage({ params }: Props) {
  const { id } = await params;
  const user = await requireUser();
  const workspace = await getWorkspaceForUser(id, user.id);
  if (!workspace) notFound();

  const tiles = [
    {
      href: `/workspaces/${workspace.id}/knowledge-base`,
      icon: Database,
      title: 'Knowledge base',
      description: 'URLs, uploads, brand context',
      body: "Add the client's site so the AI knows the brand.",
      accent: 'from-indigo-500/10 to-indigo-500/0',
      iconBg: 'bg-indigo-500/10 text-indigo-700',
    },
    {
      href: `/workspaces/${workspace.id}/generations`,
      icon: ImageIcon,
      title: 'Generations',
      description: 'Banners produced from briefs',
      body: 'Brief + brand context → HTML + PNG in ~30 s.',
      accent: 'from-emerald-500/10 to-emerald-500/0',
      iconBg: 'bg-emerald-500/10 text-emerald-700',
    },
    {
      href: `/workspaces/${workspace.id}/settings`,
      icon: SettingsIcon,
      title: 'Settings',
      description: 'Brand colours, fonts, auto-detect',
      body: 'Tune the brand the AI uses when generating banners.',
      accent: 'from-pink-500/10 to-pink-500/0',
      iconBg: 'bg-pink-500/10 text-pink-700',
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <Link href="/workspaces" className="text-sm text-slate-700 hover:text-slate-900">
            ← All workspaces
          </Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
            {workspace.name}
          </h1>
          {workspace.description && (
            <p className="mt-1 max-w-2xl text-sm text-slate-700">{workspace.description}</p>
          )}
        </div>
        <DeleteWorkspaceButton id={workspace.id} name={workspace.name} />
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tiles.map((t) => {
          const Icon = t.icon;
          return (
            <Link
              key={t.href}
              href={t.href}
              className="group relative block overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all hover:border-slate-300 hover:shadow-md"
            >
              <div
                className={`absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity group-hover:opacity-100 ${t.accent}`}
              />
              <Card className="relative h-full border-0 shadow-none">
                <CardHeader>
                  <div className={`mb-3 grid size-9 place-items-center rounded-lg ${t.iconBg}`}>
                    <Icon className="size-5" />
                  </div>
                  <CardTitle className="flex items-center gap-2">
                    {t.title}
                    <ArrowRight className="size-4 text-slate-400 transition-transform group-hover:translate-x-1 group-hover:text-slate-700" />
                  </CardTitle>
                  <CardDescription>{t.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-700">{t.body}</p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
