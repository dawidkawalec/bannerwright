'use client';

import { useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { TimeseriesPoint } from '@/lib/db/queries/stats';

type Mode = 'count' | 'cost';
type Range = '7d' | '30d' | 'all';

export function GenerationsChart({
  data,
  title = 'Generation activity',
  description = 'Banners generated and AI cost per day.',
}: {
  data: TimeseriesPoint[];
  title?: string;
  description?: string;
}) {
  const [mode, setMode] = useState<Mode>('count');
  const [range, setRange] = useState<Range>('30d');

  const sliced =
    range === '7d' ? data.slice(-7) : range === '30d' ? data.slice(-30) : data;

  const formatDate = (d: string) => {
    const date = new Date(d);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const fmtValue = (v: number) =>
    mode === 'cost'
      ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 4 }).format(v)
      : String(v);

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-lg">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Tabs value={mode} onValueChange={(v) => setMode(v as Mode)}>
              <TabsList>
                <TabsTrigger value="count">Generations</TabsTrigger>
                <TabsTrigger value="cost">Cost</TabsTrigger>
              </TabsList>
            </Tabs>
            <Tabs value={range} onValueChange={(v) => setRange(v as Range)}>
              <TabsList>
                <TabsTrigger value="7d">7d</TabsTrigger>
                <TabsTrigger value="30d">30d</TabsTrigger>
                <TabsTrigger value="all">All</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:px-4">
        <div className="h-[260px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sliced} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="genGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-chart-1)" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="var(--color-chart-1)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'var(--color-muted-foreground)', fontSize: 11 }}
                tickFormatter={formatDate}
                minTickGap={24}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'var(--color-muted-foreground)', fontSize: 11 }}
                width={48}
                tickFormatter={(v) =>
                  mode === 'cost'
                    ? `$${Number(v).toFixed(2)}`
                    : v >= 1000
                      ? `${(v / 1000).toFixed(1)}k`
                      : String(v)
                }
              />
              <RechartsTooltip
                cursor={{ stroke: 'var(--color-border)', strokeWidth: 1 }}
                content={({ active, payload, label }) => {
                  if (!active || !payload || payload.length === 0) return null;
                  const v = payload[0]?.value as number;
                  return (
                    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-md">
                      <p className="font-medium text-muted-foreground">{formatDate(label as string)}</p>
                      <p className="mt-0.5 font-semibold text-foreground">{fmtValue(v)}</p>
                    </div>
                  );
                }}
              />
              <Area
                type="monotone"
                dataKey={mode === 'count' ? 'count' : 'costUsd'}
                stroke="var(--color-chart-1)"
                strokeWidth={2}
                fill="url(#genGradient)"
                animationDuration={500}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
