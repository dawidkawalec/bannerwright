import Link from 'next/link';
import type { BrandColors, BrandFonts } from '@/lib/db/schema';

type Props = {
  colors?: BrandColors | null;
  fonts?: BrandFonts | null;
  /** Settings page link target; if provided, "auto-detect" text becomes a link. */
  workspaceId?: string;
};

const SWATCH_KEYS: Array<{ key: keyof BrandColors; label: string }> = [
  { key: 'primary', label: 'Primary' },
  { key: 'secondary', label: 'Secondary' },
  { key: 'accent', label: 'Accent' },
  { key: 'background', label: 'Background' },
  { key: 'text', label: 'Text' },
];

export function BrandPreview({ colors, fonts, workspaceId }: Props) {
  const hasAnyColor = !!colors && SWATCH_KEYS.some((s) => colors[s.key]);
  const hasAnyFont = !!fonts && (fonts.headline || fonts.body);

  if (!hasAnyColor && !hasAnyFont) {
    return (
      <p className="text-xs text-muted-foreground">
        No brand set —{' '}
        {workspaceId ? (
          <Link
            href={`/workspaces/${workspaceId}/settings`}
            className="font-medium text-primary underline-offset-2 hover:underline"
          >
            auto-detect from Settings
          </Link>
        ) : (
          'auto-detect from Settings'
        )}
        .
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-md border border-border bg-muted/30 p-3">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        Brand context
      </p>
      {hasAnyColor && (
        <div className="flex flex-wrap items-center gap-1.5">
          {SWATCH_KEYS.map((s) => {
            const value = colors?.[s.key];
            if (!value) return null;
            return (
              <span
                key={s.key}
                title={`${s.label} ${value}`}
                className="inline-flex size-5 rounded-full border border-black/10 shadow-sm"
                style={{ backgroundColor: value }}
              />
            );
          })}
        </div>
      )}
      {hasAnyFont && (
        <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
          {fonts?.headline && (
            <span>
              <span className="text-foreground/70">Headline</span>{' '}
              <span className="font-medium text-foreground">{fonts.headline}</span>
            </span>
          )}
          {fonts?.body && (
            <span>
              <span className="text-foreground/70">Body</span>{' '}
              <span className="font-medium text-foreground">{fonts.body}</span>
            </span>
          )}
        </div>
      )}
    </div>
  );
}
