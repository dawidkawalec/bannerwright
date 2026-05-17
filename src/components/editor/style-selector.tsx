'use client';

import { Check, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { STYLE_PRESETS, type StylePresetId } from '@/lib/ai/style-presets';

const ORDER: StylePresetId[] = [
  'auto',
  'minimalist',
  'bold',
  'editorial',
  'photographic',
  'glassmorphic',
  'brutalist',
];

export function StyleSelector({
  value,
  onChange,
  disabled,
}: {
  value: StylePresetId;
  onChange: (id: StylePresetId) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-1.5">
        {ORDER.map((id) => {
          const preset = STYLE_PRESETS[id];
          const active = value === id;
          return (
            <button
              key={id}
              type="button"
              disabled={disabled}
              onClick={() => onChange(id)}
              title={preset.description}
              className={cn(
                'inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                active
                  ? 'border-primary bg-primary/15 text-primary'
                  : 'border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground',
                disabled && 'cursor-not-allowed opacity-50',
              )}
            >
              {active && <Check className="size-3" />}
              {preset.label}
            </button>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground">
        {STYLE_PRESETS[value].description}
      </p>
      {value === 'auto' && (
        <p className="flex items-start gap-1.5 rounded-md border border-amber-500/30 bg-amber-500/10 px-2.5 py-1.5 text-xs text-amber-700 dark:text-amber-300">
          <Zap className="mt-0.5 size-3 shrink-0" />
          <span>
            <span className="font-medium">Skips Nano Banana.</span>{' '}
            Cheaper (~$0.02) and faster (~25 s) but plainer output. Pick another preset for design-quality results.
          </span>
        </p>
      )}
    </div>
  );
}
