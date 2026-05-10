import Link from 'next/link';
import { ArrowRight, Database, Plus, Sparkles, type LucideIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export type QuickAction = {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
  /** tailwind colour pair e.g. 'from-primary to-primary/70' */
  gradient: string;
};

const defaultActions = (workspaceId?: string): QuickAction[] => [
  workspaceId
    ? {
        href: `/workspaces/${workspaceId}/generations/new`,
        label: 'Generate banner',
        description: 'Brief + brand context → HTML + PNG',
        icon: Sparkles,
        gradient: 'from-emerald-500 to-teal-500',
      }
    : {
        href: '/workspaces/new',
        label: 'New workspace',
        description: 'Set up a brand workspace',
        icon: Plus,
        gradient: 'from-emerald-500 to-teal-500',
      },
  {
    href: workspaceId ? `/workspaces/${workspaceId}/knowledge-base` : '/workspaces',
    label: 'Add knowledge source',
    description: 'URLs, uploads, brand notes',
    icon: Database,
    gradient: 'from-blue-500 to-indigo-500',
  },
];

export function QuickActionsCard({
  workspaceId,
  actions,
  title = 'Quick actions',
}: {
  workspaceId?: string;
  actions?: QuickAction[];
  title?: string;
}) {
  const items = actions ?? defaultActions(workspaceId);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>Fast paths into the most common flows.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-2">
          {items.map((a) => {
            const Icon = a.icon;
            return (
              <Link
                key={a.href + a.label}
                href={a.href}
                className="group flex items-center gap-3 rounded-lg border border-border bg-background px-3 py-2.5 transition-all hover:border-primary/40 hover:shadow-sm"
              >
                <div
                  className={cn(
                    'grid size-9 place-items-center rounded-lg bg-gradient-to-br text-white shadow-sm',
                    a.gradient,
                  )}
                >
                  <Icon className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{a.label}</p>
                  <p className="truncate text-xs text-muted-foreground">{a.description}</p>
                </div>
                <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
