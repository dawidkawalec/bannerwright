'use client';

import { Check } from 'lucide-react';
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
    </div>
  );
}
