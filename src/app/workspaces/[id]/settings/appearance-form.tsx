'use client';

import { useTheme } from 'next-themes';
import { useCallback, useEffect, useState } from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

const FONT_PREF_KEY = 'bw-font-family';
const DENSITY_PREF_KEY = 'bw-density-compact';

const fontChoices: { id: string; label: string; sample: string }[] = [
  { id: 'poppins', label: 'Poppins', sample: 'Poppins, sans-serif' },
  { id: 'inter', label: 'Inter', sample: 'Inter, system-ui, sans-serif' },
  { id: 'system', label: 'System', sample: 'system-ui, -apple-system, Segoe UI, sans-serif' },
];

function readInitialFont(): string {
  if (typeof window === 'undefined') return 'poppins';
  return localStorage.getItem(FONT_PREF_KEY) ?? 'poppins';
}

function readInitialDensity(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(DENSITY_PREF_KEY) === '1';
}

function applyFontVar(id: string) {
  const choice = fontChoices.find((f) => f.id === id);
  if (!choice) return;
  document.documentElement.style.setProperty('--font-sans', choice.sample);
}

function applyDensityVar(checked: boolean) {
  document.documentElement.dataset.density = checked ? 'compact' : 'cozy';
}

export function AppearanceForm() {
  const { theme, setTheme } = useTheme();
  const [font, setFont] = useState<string>(readInitialFont);
  const [density, setDensity] = useState<boolean>(readInitialDensity);

  // Apply persisted preferences on mount.
  useEffect(() => {
    applyFontVar(font);
    applyDensityVar(density);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pickFont = useCallback((id: string) => {
    setFont(id);
    localStorage.setItem(FONT_PREF_KEY, id);
    applyFontVar(id);
  }, []);

  const pickDensity = useCallback((checked: boolean) => {
    setDensity(checked);
    localStorage.setItem(DENSITY_PREF_KEY, checked ? '1' : '0');
    applyDensityVar(checked);
  }, []);

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <Label className="text-sm font-medium">Theme</Label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: 'light', label: 'Light', icon: Sun },
            { id: 'dark', label: 'Dark', icon: Moon },
            { id: 'system', label: 'System', icon: Monitor },
          ].map((t) => {
            const Icon = t.icon;
            const active = theme === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTheme(t.id)}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 rounded-lg border p-3 text-xs font-medium transition-all',
                  active
                    ? 'border-primary bg-primary/5 text-primary shadow-sm'
                    : 'border-border bg-background text-muted-foreground hover:border-primary/30 hover:text-foreground',
                )}
              >
                <Icon className="size-4" />
                {t.label}
              </button>
            );
          })}
        </div>
      </section>

      <section className="space-y-3">
        <Label className="text-sm font-medium">Font family</Label>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {fontChoices.map((f) => {
            const active = font === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => pickFont(f.id)}
                className={cn(
                  'flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-all',
                  active
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'border-border bg-background hover:border-primary/30',
                )}
              >
                <span
                  className="text-base font-semibold text-foreground"
                  style={{ fontFamily: f.sample }}
                >
                  Aa
                </span>
                <span className="text-xs font-medium" style={{ fontFamily: f.sample }}>
                  {f.label}
                </span>
              </button>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground">
          Affects only this browser — saved to localStorage.
        </p>
      </section>

      <section className="flex items-start justify-between gap-4 rounded-lg border border-border bg-muted/30 p-3">
        <div>
          <Label className="text-sm font-medium">Compact density</Label>
          <p className="text-xs text-muted-foreground">
            Shrinks paddings in lists for power users.
          </p>
        </div>
        <Switch checked={density} onCheckedChange={pickDensity} />
      </section>
    </div>
  );
}
