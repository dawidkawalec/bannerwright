import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowRight, Hammer } from 'lucide-react';
import { getSession } from '@/lib/auth/current-user';
import { Button } from '@/components/ui/button';

export const metadata = {
  title: 'Bannerwright — AI workshop for HTML banners',
  description:
    'Self-hostable, open-source AI workshop that turns a brief and brand context into editable HTML banners.',
};

export default async function RootPage() {
  const { user } = await getSession();
  if (user) redirect('/workspaces');

  return (
    <main className="bw-hero-bg relative grid min-h-screen place-items-center px-6">
      <div className="text-center">
        <div className="mx-auto mb-6 flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-lg ring-1 ring-primary/30">
          <Hammer className="size-5" />
        </div>
        <h1 className="text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
          Bannerwright
        </h1>
        <p className="mx-auto mt-3 max-w-md text-pretty text-base text-muted-foreground">
          An AI workshop for makers of HTML banners. Brief in, editable banner out.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Button asChild size="lg" className="h-11 px-5">
            <Link href="/login">
              Sign in
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
        <p className="mt-10 text-xs text-muted-foreground">
          Open source · MIT · self-hosted
        </p>
      </div>

      <p className="absolute bottom-6 text-[11px] text-muted-foreground/70">
        © {new Date().getFullYear()} Bannerwright
      </p>
    </main>
  );
}
