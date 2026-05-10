'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BannerPreview } from '@/components/banner-preview';
import { formats, formatLabels } from '@/lib/schemas/generations';
import type { GenerationFormat } from '@/lib/db/schema';

type Step =
  | { kind: 'idle' }
  | { kind: 'progress'; label: string }
  | { kind: 'streaming' }
  | { kind: 'rendering' }
  | { kind: 'done' }
  | { kind: 'error'; message: string };

const STEP_LABELS: Record<string, string> = {
  analyzing_kb: 'Analysing knowledge base…',
  generating_html: 'Drafting HTML…',
  rendering_png: 'Rendering PNG…',
};

export function GenerateFlow({
  workspaceId,
  readyKbCount,
  hasBrand,
}: {
  workspaceId: string;
  readyKbCount: number;
  hasBrand: boolean;
}) {
  const router = useRouter();
  const [format, setFormat] = useState<GenerationFormat>('square_1080');
  const [brief, setBrief] = useState('');
  const [title, setTitle] = useState('');
  const [step, setStep] = useState<Step>({ kind: 'idle' });
  const [html, setHtml] = useState<string>('');
  const [generationId, setGenerationId] = useState<string | null>(null);
  const [costUsd, setCostUsd] = useState<number | null>(null);

  const isWorking =
    step.kind === 'progress' || step.kind === 'streaming' || step.kind === 'rendering';

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStep({ kind: 'progress', label: STEP_LABELS.analyzing_kb! });
    setHtml('');
    setGenerationId(null);
    setCostUsd(null);

    const res = await fetch('/api/generations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workspaceId, format, brief, title: title || undefined }),
    });

    if (!res.ok || !res.body) {
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      setStep({ kind: 'error', message: body.error ?? `HTTP ${res.status}` });
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let nl: number;
      while ((nl = buffer.indexOf('\n\n')) !== -1) {
        const raw = buffer.slice(0, nl);
        buffer = buffer.slice(nl + 2);
        if (!raw.startsWith('data: ')) continue;
        const event = parseEvent(raw.slice(6));
        if (!event) continue;
        applyEvent(event);
      }
    }
  }

  function applyEvent(event: ServerEvent) {
    switch (event.type) {
      case 'progress':
        if (event.step === 'rendering_png') setStep({ kind: 'rendering' });
        else if (event.step === 'generating_html') setStep({ kind: 'streaming' });
        else setStep({ kind: 'progress', label: STEP_LABELS[event.step] ?? event.step });
        break;
      case 'partial_html':
        setHtml(event.html);
        if (step.kind !== 'streaming') setStep({ kind: 'streaming' });
        break;
      case 'done':
        setHtml(event.htmlFinal);
        setGenerationId(event.generationId);
        setCostUsd(event.costUsd);
        setStep({ kind: 'done' });
        break;
      case 'error':
        setStep({ kind: 'error', message: event.message });
        break;
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
      <Card>
        <CardHeader>
          <CardTitle>Brief</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="title">Title (optional)</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Winter sale teaser"
                maxLength={120}
                disabled={isWorking}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="format">Format</Label>
              <select
                id="format"
                value={format}
                onChange={(e) => setFormat(e.target.value as GenerationFormat)}
                disabled={isWorking}
                className="flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {formats.map((f) => (
                  <option key={f} value={f}>
                    {formatLabels[f]}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="brief">What to make</Label>
              <textarea
                id="brief"
                value={brief}
                onChange={(e) => setBrief(e.target.value)}
                rows={6}
                required
                minLength={3}
                maxLength={2_000}
                disabled={isWorking}
                placeholder="Promo for our winter sale. 30% off everything until December 15. Bold, punchy, lots of contrast."
                className="flex w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            <div className="flex flex-col gap-2 text-xs text-slate-700">
              <span>{readyKbCount} ready KB source{readyKbCount === 1 ? '' : 's'} will inform the prompt.</span>
              {!hasBrand && <span>No brand set — AI uses tasteful defaults.</span>}
            </div>

            <Button type="submit" disabled={isWorking || brief.trim().length < 3}>
              {isWorking ? 'Generating…' : 'Generate banner'}
            </Button>

            {step.kind === 'progress' && (
              <p className="text-sm text-slate-700">{step.label}</p>
            )}
            {step.kind === 'streaming' && (
              <p className="text-sm text-slate-700">Streaming HTML…</p>
            )}
            {step.kind === 'rendering' && (
              <p className="text-sm text-slate-700">Rendering PNG…</p>
            )}
            {step.kind === 'error' && (
              <p className="text-sm text-red-600" role="alert">
                {step.message}
              </p>
            )}
            {step.kind === 'done' && generationId && (
              <div className="flex flex-col gap-2 rounded-md bg-emerald-50 p-3 text-sm text-emerald-800">
                <span>
                  Done {costUsd !== null && `· $${costUsd.toFixed(4)}`}
                </span>
                <Button
                  type="button"
                  size="sm"
                  onClick={() =>
                    router.push(`/workspaces/${workspaceId}/generations/${generationId}`)
                  }
                >
                  Open banner →
                </Button>
              </div>
            )}
          </form>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-2">
        <p className="text-xs uppercase tracking-wide text-slate-700">Live preview</p>
        <BannerPreview html={html} format={format} />
      </div>
    </div>
  );
}

type ServerEvent =
  | { type: 'progress'; step: string }
  | { type: 'partial_html'; html: string }
  | {
      type: 'done';
      generationId: string;
      versionId: string;
      htmlFinal: string;
      pngUrl: string;
      tokens: { input: number; output: number };
      costUsd: number;
    }
  | { type: 'error'; message: string };

function parseEvent(data: string): ServerEvent | null {
  try {
    return JSON.parse(data) as ServerEvent;
  } catch {
    return null;
  }
}
