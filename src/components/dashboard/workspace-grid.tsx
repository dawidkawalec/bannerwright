'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowUpRight, Image as ImageIcon, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { Workspace } from '@/lib/db/schema';
import type { WorkspaceWithStats } from '@/lib/db/queries/stats';
import { cn } from '@/lib/utils';

function formatRelative(d: Date | null) {
  if (!d) return 'no activity yet';
  const date = new Date(d);
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return date.toLocaleDateString();
}

function brandSwatch(ws: Workspace): string[] {
  const c = ws.brandColors ?? {};
  const out = [c.primary, c.secondary, c.accent, c.background].filter(Boolean) as string[];
  if (out.length > 0) return out.slice(0, 4);
  // fallback: derive from id (stable pseudo-random)
  return ['var(--color-chart-1)', 'var(--color-chart-2)', 'var(--color-chart-3)'];
}

export function WorkspaceGrid({
  workspaces,
  stats,
}: {
  workspaces: Workspace[];
  stats: Map<string, WorkspaceWithStats>;
}) {
  if (workspaces.length === 0) {
    return (
      <Card>
        <CardContent className="grid place-items-center gap-3 py-12 text-center">
          <div className="grid size-12 place-items-center rounded-full bg-primary/10 text-primary">
            <Sparkles className="size-6" />
          </div>
          <div>
            <p className="text-base font-medium text-foreground">No workspaces yet</p>
            <p className="text-sm text-muted-foreground">
              Create a workspace per brand to start generating banners.
            </p>
          </div>
          <Link
            href="/workspaces/new"
            className="mt-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Create workspace
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {workspaces.map((ws, i) => {
        const s = stats.get(ws.id);
        const swatch = brandSwatch(ws);
        return (
          <motion.div
            key={ws.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: i * 0.04 }}
          >
            <Link href={`/workspaces/${ws.id}`} className="group block">
              <Card className="h-full overflow-hidden transition-all hover:border-primary/40 hover:shadow-md">
                {/* Brand strip */}
                <div className="flex h-14 items-end gap-1 px-5 pt-4">
                  {swatch.map((c, idx) => (
                    <span
                      key={idx}
                      className="h-2 flex-1 rounded-full"
                      style={{ background: c }}
                    />
                  ))}
                </div>
                <CardContent className="space-y-4 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          'grid size-11 place-items-center rounded-xl text-base font-semibold uppercase text-primary-foreground shadow-sm',
                        )}
                        style={{ background: swatch[0] ?? 'var(--color-primary)' }}
                      >
                        {ws.name.slice(0, 2)}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-base font-semibold text-foreground group-hover:text-primary">
                          {ws.name}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {ws.slug}
                        </p>
                      </div>
                    </div>
                    <ArrowUpRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                  </div>

                  {ws.description && (
                    <p className="line-clamp-2 text-sm text-muted-foreground">{ws.description}</p>
                  )}

                  <div className="grid grid-cols-3 gap-3 border-t border-border pt-3">
                    <Stat icon={<ImageIcon className="size-3.5" />} label="Generations" value={s?.generationCount ?? 0} />
                    <Stat label="Templates" value={s?.templateCount ?? 0} />
                    <Stat label="Spent" value={`$${(s?.totalCostUsd ?? 0).toFixed(2)}`} />
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Last activity: {formatRelative(s?.lastGenerationAt ?? null)}
                  </div>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        );
      })}

      {/* Add new tile */}
      <Link href="/workspaces/new" className="group">
        <Card className="flex h-full items-center justify-center border-dashed border-border/70 bg-muted/20 transition-all hover:border-primary/40 hover:bg-primary/5">
          <CardContent className="grid place-items-center gap-2 py-12 text-center">
            <div className="grid size-12 place-items-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
              <Sparkles className="size-5" />
            </div>
            <p className="text-sm font-medium text-foreground">New workspace</p>
            <p className="text-xs text-muted-foreground">One workspace per brand</p>
          </CardContent>
        </Card>
      </Link>
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div>
      <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {icon}
        {label}
      </p>
      <p className="mt-0.5 text-base font-semibold text-foreground">{value}</p>
    </div>
  );
}
