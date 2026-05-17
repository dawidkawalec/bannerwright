'use client';

import { motion } from 'framer-motion';
import { Area, AreaChart, ResponsiveContainer } from 'recharts';
import {
  ArrowDown,
  ArrowUp,
  Activity,
  Database,
  DollarSign,
  FolderKanban,
  Image as ImageIcon,
  LayoutTemplate,
  Sparkles,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export type StatIconKey =
  | 'image'
  | 'dollar'
  | 'database'
  | 'workspaces'
  | 'template'
  | 'wallet'
  | 'activity'
  | 'sparkles';

const ICONS: Record<StatIconKey, LucideIcon> = {
  image: ImageIcon,
  dollar: DollarSign,
  database: Database,
  workspaces: FolderKanban,
  template: LayoutTemplate,
  wallet: Wallet,
  activity: Activity,
  sparkles: Sparkles,
};

export type StatCard = {
  title: string;
  value: string;
  change?: string;
  trend?: 'up' | 'down' | 'flat';
  /** Icon key — resolved to a Lucide icon inside the client. Server cannot pass function components. */
  iconKey: StatIconKey;
  /** Tailwind gradient pair, e.g. 'from-emerald-500 to-teal-500' */
  gradient: string;
  /** Stroke colour for the sparkline */
  strokeColor: string;
  /** Sparkline series (any numbers) */
  series?: number[];
};

export function StatsCards({ items }: { items: StatCard[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((stat, i) => (
        <StatTile key={stat.title} stat={stat} index={i} />
      ))}
    </div>
  );
}

function StatTile({ stat, index }: { stat: StatCard; index: number }) {
  const Icon = ICONS[stat.iconKey] ?? ICONS.sparkles;
  const data = (stat.series ?? []).map((value) => ({ value }));
  const trend = stat.trend ?? 'flat';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.06 }}
    >
      <Card className="relative overflow-hidden border-border/60 bg-card transition-all hover:shadow-md">
        <div className="relative p-5">
          <div className="mb-4 flex items-start justify-between">
            <div
              className={cn(
                'grid size-11 place-items-center rounded-xl bg-gradient-to-br text-white shadow-sm',
                stat.gradient,
              )}
            >
              <Icon className="size-5" />
            </div>
            {data.length > 1 && (
              <div className="h-12 w-32 min-w-[128px] flex-shrink-0">
                <ResponsiveContainer width="100%" height="100%" minWidth={128} minHeight={48}>
                  <AreaChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id={`spark-${index}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={stat.strokeColor} stopOpacity={0.35} />
                        <stop offset="95%" stopColor={stat.strokeColor} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke={stat.strokeColor}
                      strokeWidth={2}
                      fill={`url(#spark-${index})`}
                      animationDuration={800}
                      isAnimationActive
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="space-y-1">
            <p className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              {stat.value}
            </p>
            <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
          </div>

          {stat.change && (
            <div className="mt-3 flex items-center gap-2">
              <span
                className={cn(
                  'grid size-5 place-items-center rounded-full',
                  trend === 'up' && 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40',
                  trend === 'down' && 'bg-rose-100 text-rose-600 dark:bg-rose-950/40',
                  trend === 'flat' && 'bg-muted text-muted-foreground',
                )}
              >
                {trend === 'up' ? (
                  <ArrowUp className="size-3" />
                ) : trend === 'down' ? (
                  <ArrowDown className="size-3" />
                ) : (
                  <span className="block size-1.5 rounded-full bg-current" />
                )}
              </span>
              <span
                className={cn(
                  'text-xs font-medium',
                  trend === 'up' && 'text-emerald-600 dark:text-emerald-400',
                  trend === 'down' && 'text-rose-600 dark:text-rose-400',
                  trend === 'flat' && 'text-muted-foreground',
                )}
              >
                {stat.change}
              </span>
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}
