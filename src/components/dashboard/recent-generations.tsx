'use client';

import Link from 'next/link';
import { ArrowUpRight, Image as ImageIcon, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { RecentGenerationRow } from '@/lib/db/queries/stats';

const formatLabel: Record<string, string> = {
  square_1080: 'Square 1080',
  story_1080_1920: 'Story 9:16',
  landscape_1200_628: 'Landscape',
  portrait_1200_1500: 'Portrait',
};

function formatRelative(d: Date | string) {
  const date = typeof d === 'string' ? new Date(d) : d;
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return date.toLocaleDateString();
}

export function RecentGenerations({
  rows,
  showWorkspace = true,
  emptyHint = 'No banners yet — create your first generation to see it here.',
}: {
  rows: RecentGenerationRow[];
  showWorkspace?: boolean;
  emptyHint?: string;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Recent generations</CardTitle>
            <CardDescription>Latest banners across {showWorkspace ? 'all workspaces' : 'this workspace'}.</CardDescription>
          </div>
          <Link
            href="/workspaces"
            className="hidden text-xs font-medium text-primary hover:underline sm:inline-flex"
          >
            View all
          </Link>
        </div>
      </CardHeader>
      <CardContent className="px-0">
        {rows.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <div className="mx-auto mb-3 grid size-10 place-items-center rounded-full bg-primary/10 text-primary">
              <Sparkles className="size-5" />
            </div>
            <p className="text-sm text-muted-foreground">{emptyHint}</p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {rows.map((row, i) => (
              <motion.li
                key={row.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.25, delay: i * 0.04 }}
              >
                <Link
                  href={`/workspaces/${row.workspaceId}/generations/${row.id}`}
                  className="group flex items-center gap-3 px-6 py-3 transition-colors hover:bg-muted/40"
                >
                  <Thumbnail
                    generationId={row.id}
                    hasPng={Boolean(row.currentPngPath || row.thumbnailPath)}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground group-hover:text-primary">
                      {row.title}
                    </p>
                    <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="outline" className="border-primary/20 text-primary">
                        {formatLabel[row.format] ?? row.format}
                      </Badge>
                      {row.isTemplate && (
                        <Badge variant="secondary" className="bg-amber-500/10 text-amber-700 dark:text-amber-300">
                          Template
                        </Badge>
                      )}
                      {showWorkspace && <span className="truncate">{row.workspaceName}</span>}
                      <span>·</span>
                      <span>{formatRelative(row.updatedAt)}</span>
                    </div>
                  </div>
                  <ArrowUpRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
                </Link>
              </motion.li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function Thumbnail({
  generationId,
  hasPng,
}: {
  generationId: string;
  hasPng: boolean;
}) {
  if (hasPng) {
    return (
      <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-muted ring-1 ring-border">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/api/generations/${generationId}/png`}
          alt=""
          className={cn('size-full object-cover')}
          loading="lazy"
        />
      </div>
    );
  }
  return (
    <div className="grid size-12 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 ring-1 ring-border">
      <ImageIcon className="size-5 text-primary/70" />
    </div>
  );
}
