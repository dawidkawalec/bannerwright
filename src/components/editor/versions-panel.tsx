'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { HelpHint } from '@/components/ui/help-hint';
import type { VersionTrigger } from '@/lib/db/schema';

export type VersionRow = {
  id: string;
  versionNumber: number;
  triggeredBy: VersionTrigger;
  createdAt: string;
};

const TRIGGER_LABELS: Record<VersionTrigger, string> = {
  initial_generation: 'initial',
  manual_edit: 'manual',
  ai_edit: 'AI',
  restore: 'restore',
};

export function VersionsPanel({
  versions,
  onRestore,
  disabled,
}: {
  versions: VersionRow[];
  onRestore: (versionId: string) => void;
  disabled?: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          Versions
          <HelpHint text='Każda zmiana (manualna, przez AI, "Generate background", restore) tworzy nową wersję. Klik "Restore" tworzy KOLEJNĄ wersję z HTML wybranej historycznej — historia nigdy nie ginie.' />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ol className="flex max-h-64 flex-col gap-2 overflow-y-auto text-sm">
          {versions.map((v, idx) => (
            <li
              key={v.id}
              className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2"
            >
              <span className="flex flex-col">
                <span className="font-medium text-slate-800">v{v.versionNumber}</span>
                <span className="text-xs uppercase tracking-wide text-slate-700">
                  {TRIGGER_LABELS[v.triggeredBy]}
                </span>
              </span>
              {idx > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7"
                  onClick={() => onRestore(v.id)}
                  disabled={disabled}
                >
                  Restore
                </Button>
              )}
              {idx === 0 && (
                <span className="text-xs text-slate-500">current</span>
              )}
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}
