'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { ArrowRight, Globe, Sparkles, Workflow } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { onboardWorkspace } from '@/app/actions/workspaces';

export function OnboardingHero({ email }: { email: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');

  function submit(formData: FormData) {
    setError(null);
    const input = {
      name: String(formData.get('name') ?? '').trim(),
      url: String(formData.get('url') ?? '').trim() || undefined,
    };
    if (input.name.length < 2) {
      setError('Workspace name needs at least 2 characters');
      return;
    }
    startTransition(async () => {
      const res = await onboardWorkspace(input);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.replace(`/workspaces/${res.data.id}`);
      router.refresh();
    });
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 py-8">
      <header className="text-center">
        <p className="text-xs font-medium uppercase tracking-widest text-primary">
          Welcome to Bannerwright
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Let&apos;s build your first banner
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Three steps. Brand in, banner out. Each AI edit is a new version you can roll back.
        </p>
      </header>

      <ol className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Step number={1} icon={<Workflow className="size-4" />} title="Name the workspace" body="One brand per workspace." />
        <Step number={2} icon={<Globe className="size-4" />} title="Drop a brand URL" body="We screenshot, scrape, auto-detect brand." />
        <Step number={3} icon={<Sparkles className="size-4" />} title="Generate" body="Brief → 5-10 node banner in ~30 s." />
      </ol>

      <form
        action={submit}
        className="rounded-2xl border border-border bg-card p-6 shadow-sm"
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="onb-name">Workspace name</Label>
            <Input
              id="onb-name"
              name="name"
              required
              maxLength={80}
              placeholder={defaultNameFromEmail(email)}
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              Usually the client&apos;s brand. Slug is generated automatically.
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="onb-url">Brand URL (optional)</Label>
            <Input
              id="onb-url"
              name="url"
              type="url"
              maxLength={500}
              placeholder="https://stripe.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              We&apos;ll screenshot it and extract colours / fonts / tone in the background.
              You can run &ldquo;Auto-detect brand&rdquo; from Settings once it&apos;s ready.
            </p>
          </div>

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          <Button type="submit" disabled={pending} className="w-full sm:w-auto sm:self-end">
            {pending ? 'Setting up…' : 'Create workspace'}
            {!pending && <ArrowRight className="ml-2 size-4" />}
          </Button>
        </div>
      </form>
    </div>
  );
}

function Step({
  number,
  icon,
  title,
  body,
}: {
  number: number;
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <li className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2">
        <span className="grid size-6 place-items-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
          {number}
        </span>
        <span className="grid size-6 place-items-center rounded-md bg-muted text-foreground">
          {icon}
        </span>
      </div>
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="text-xs text-muted-foreground">{body}</p>
    </li>
  );
}

function defaultNameFromEmail(email: string): string {
  const local = email.split('@')[0] ?? '';
  if (!local) return 'Acme';
  return local.charAt(0).toUpperCase() + local.slice(1);
}
