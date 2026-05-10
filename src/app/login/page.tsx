import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Hammer, Sparkles } from 'lucide-react';
import { getSession } from '@/lib/auth/current-user';
import { LoginForm } from './login-form';

export const metadata = { title: 'Sign in — Bannerwright' };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { user } = await getSession();
  const { next } = await searchParams;
  if (user) redirect(next ?? '/workspaces');

  return (
    <div className="bw-hero-bg relative flex min-h-screen items-center justify-center p-6">
      <Link
        href="/"
        className="absolute left-6 top-6 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-3" />
        Back to home
      </Link>

      <div className="grid w-full max-w-5xl grid-cols-1 overflow-hidden rounded-2xl border border-border bg-card shadow-2xl ring-1 ring-foreground/5 lg:grid-cols-2">
        {/* Left: brand panel */}
        <div className="relative hidden flex-col justify-between bg-gradient-to-br from-primary via-primary/90 to-blue-500 p-10 text-primary-foreground lg:flex">
          <div>
            <div className="flex items-center gap-2 text-base font-semibold tracking-tight">
              <span className="grid size-8 place-items-center rounded-lg bg-white/15 backdrop-blur">
                <Hammer className="size-4" />
              </span>
              Bannerwright
            </div>
          </div>

          <div>
            <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-xs font-medium backdrop-blur">
              <Sparkles className="size-3" />
              AI banner workshop
            </div>
            <h2 className="text-3xl font-semibold leading-tight">
              From a brief to an editable HTML banner.
              <span className="block opacity-80">In about thirty seconds.</span>
            </h2>
            <p className="mt-4 max-w-md text-sm opacity-85">
              Self-hosted, open source. Each generation is a real HTML file you can read, edit and
              own — PNG is just the export.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 text-xs opacity-90">
            <Stat n="Open" label="MIT license" />
            <Stat n="Self" label="Hostable" />
            <Stat n="One" label="Account" />
          </div>

          {/* decorative blobs */}
          <div className="pointer-events-none absolute -bottom-16 -right-16 size-64 rounded-full bg-white/15 blur-3xl" />
          <div className="pointer-events-none absolute -top-20 right-12 size-44 rounded-full bg-white/10 blur-2xl" />
        </div>

        {/* Right: form */}
        <div className="flex items-center justify-center p-8 sm:p-12">
          <div className="w-full max-w-sm">
            <div className="mb-6 lg:hidden">
              <h1 className="text-xl font-semibold tracking-tight text-foreground">Bannerwright</h1>
              <p className="text-sm text-muted-foreground">A workshop for makers of banners.</p>
            </div>
            <h2 className="text-xl font-semibold tracking-tight text-foreground">Welcome back</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Sign in to your workshop with email and password.
            </p>
            <div className="mt-6">
              <LoginForm next={next} />
            </div>
            <p className="mt-6 text-xs text-muted-foreground">
              Single-tenant install — no public registration.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ n, label }: { n: string; label: string }) {
  return (
    <div className="rounded-lg bg-white/10 p-3 backdrop-blur">
      <p className="text-lg font-semibold">{n}</p>
      <p className="text-[10px] uppercase tracking-wider opacity-80">{label}</p>
    </div>
  );
}
