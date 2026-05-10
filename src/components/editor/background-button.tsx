'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { generateBackgroundAction } from '@/app/actions/generations';

export function BackgroundButton({
  workspaceId,
  generationId,
  disabled,
}: {
  workspaceId: string;
  generationId: string;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function submit() {
    if (!prompt.trim() || pending) return;
    startTransition(async () => {
      setError(null);
      const res = await generateBackgroundAction(workspaceId, generationId, prompt);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setOpen(false);
      setPrompt('');
      router.refresh();
    });
  }

  if (!open) {
    return (
      <Button
        variant="outline"
        size="sm"
        disabled={disabled}
        onClick={() => setOpen(true)}
        title="Generuje obraz tła przez Nano Banana Pro i wstawia pod baner. ~$0.04 / obraz, nowa wersja w historii."
      >
        Generate background
      </Button>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Background generator</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={3}
          maxLength={1_000}
          placeholder='e.g. "warm sunset over a coffee shop interior, depth of field, soft bokeh, top-down composition"'
          className="flex w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={pending}
        />
        <p className="text-xs text-muted-foreground">
          Uses Nano Banana Pro · ≈ $0.04 per image · creates a new version.
        </p>
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setOpen(false);
              setError(null);
            }}
            disabled={pending}
          >
            Cancel
          </Button>
          <Button size="sm" onClick={submit} disabled={pending || !prompt.trim()}>
            {pending ? 'Generating…' : 'Generate'}
          </Button>
        </div>
        {error && (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
