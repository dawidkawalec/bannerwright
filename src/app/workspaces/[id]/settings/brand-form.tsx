'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { updateBrand } from '@/app/actions/workspaces';

type Initial = {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
  headlineFont: string;
  bodyFont: string;
};

const COLOR_FIELDS: Array<{ key: keyof Initial; label: string }> = [
  { key: 'primary', label: 'Primary' },
  { key: 'secondary', label: 'Secondary' },
  { key: 'accent', label: 'Accent' },
  { key: 'background', label: 'Background' },
  { key: 'text', label: 'Text' },
];

export function BrandForm({ workspaceId, initial }: { workspaceId: string; initial: Initial }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [values, setValues] = useState<Initial>(initial);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function update<K extends keyof Initial>(key: K, value: string) {
    setSaved(false);
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function onSubmit(formData: FormData) {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const res = await updateBrand(workspaceId, {
        primary: String(formData.get('primary') ?? ''),
        secondary: String(formData.get('secondary') ?? ''),
        accent: String(formData.get('accent') ?? ''),
        background: String(formData.get('background') ?? ''),
        text: String(formData.get('text') ?? ''),
        headlineFont: String(formData.get('headlineFont') ?? ''),
        bodyFont: String(formData.get('bodyFont') ?? ''),
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setSaved(true);
      router.refresh();
    });
  }

  return (
    <form action={onSubmit} className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {COLOR_FIELDS.map(({ key, label }) => (
          <div key={key} className="flex flex-col gap-1.5">
            <Label htmlFor={key}>{label}</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                aria-label={`${label} colour picker`}
                className="h-9 w-12 cursor-pointer rounded-md border border-border"
                value={values[key] || '#ffffff'}
                onChange={(e) => update(key, e.target.value)}
              />
              <Input
                id={key}
                name={key}
                placeholder="#000000"
                value={values[key]}
                onChange={(e) => update(key, e.target.value)}
                className="font-mono"
              />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="headlineFont">Headline font</Label>
          <Input
            id="headlineFont"
            name="headlineFont"
            placeholder="Inter"
            value={values.headlineFont}
            onChange={(e) => update('headlineFont', e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="bodyFont">Body font</Label>
          <Input
            id="bodyFont"
            name="bodyFont"
            placeholder="Inter"
            value={values.bodyFont}
            onChange={(e) => update('bodyFont', e.target.value)}
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? 'Saving…' : 'Save brand'}
        </Button>
        {saved && <span className="text-sm text-emerald-400">Saved.</span>}
        {error && (
          <span className="text-sm text-destructive" role="alert">
            {error}
          </span>
        )}
      </div>
    </form>
  );
}
