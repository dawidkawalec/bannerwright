import { redirect } from 'next/navigation';
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
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Bannerwright</h1>
          <p className="mt-1 text-sm text-slate-600">A workshop for makers of banners.</p>
        </div>
        <LoginForm next={next} />
      </div>
    </div>
  );
}
