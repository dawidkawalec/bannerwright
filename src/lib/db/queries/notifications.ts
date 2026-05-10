import { and, desc, eq, gte, inArray, sql } from 'drizzle-orm';
import { db } from '../client';
import { generations, kbSources, llmUsage, workspaces } from '../schema';
import type { HeaderNotification } from '@/components/layout/header';

function relative(d: Date): string {
  const diff = Date.now() - d.getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return 'now';
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

/**
 * Build the notifications surfaced in the header bell.
 * Real, derived from DB — not a static list. Limited to a handful of
 * recent / actionable signals.
 */
export async function getHeaderNotifications(userId: string): Promise<HeaderNotification[]> {
  // 1. KB sources currently processing or failed
  const wsRows = await db
    .select({ id: workspaces.id, name: workspaces.name })
    .from(workspaces)
    .where(eq(workspaces.userId, userId));

  if (wsRows.length === 0) {
    return [
      {
        id: 'welcome',
        title: 'Welcome to Bannerwright',
        body: 'Create your first workspace to start generating banners.',
        href: '/workspaces/new',
        tone: 'info',
        createdAt: 'now',
      },
    ];
  }

  const wsIds = wsRows.map((w) => w.id);
  const wsName = new Map(wsRows.map((w) => [w.id, w.name]));

  const kbActive = await db
    .select({
      id: kbSources.id,
      title: kbSources.title,
      status: kbSources.status,
      workspaceId: kbSources.workspaceId,
      createdAt: kbSources.createdAt,
      processedAt: kbSources.processedAt,
      errorMessage: kbSources.errorMessage,
    })
    .from(kbSources)
    .where(
      and(
        inArray(kbSources.workspaceId, wsIds),
        sql`${kbSources.status} in ('pending','processing','failed')`,
      ),
    )
    .orderBy(desc(kbSources.createdAt))
    .limit(5);

  // 2. Recent generations (last 24h)
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recentGens = await db
    .select({
      id: generations.id,
      title: generations.title,
      workspaceId: generations.workspaceId,
      isTemplate: generations.isTemplate,
      currentPngPath: generations.currentPngPath,
      updatedAt: generations.updatedAt,
    })
    .from(generations)
    .where(
      and(
        inArray(generations.workspaceId, wsIds),
        gte(generations.updatedAt, since),
      ),
    )
    .orderBy(desc(generations.updatedAt))
    .limit(4);

  // 3. Cost spike: yesterday's spend if > $1
  const yesterdaySince = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [costRow] = await db
    .select({
      total: sql<number>`coalesce(sum(${llmUsage.costUsd}), 0)::float`,
    })
    .from(llmUsage)
    .where(
      and(
        inArray(llmUsage.workspaceId, wsIds),
        gte(llmUsage.createdAt, yesterdaySince),
      ),
    );

  const out: HeaderNotification[] = [];

  for (const k of kbActive) {
    const ws = wsName.get(k.workspaceId) ?? 'Workspace';
    if (k.status === 'failed') {
      out.push({
        id: `kb-fail-${k.id}`,
        title: `Failed to process: ${k.title}`,
        body: k.errorMessage
          ? `${ws} · ${k.errorMessage.slice(0, 90)}`
          : `${ws} · open the knowledge base to retry.`,
        href: `/workspaces/${k.workspaceId}/knowledge-base`,
        tone: 'warning',
        createdAt: relative(k.createdAt),
      });
    } else {
      out.push({
        id: `kb-pending-${k.id}`,
        title: `Processing: ${k.title}`,
        body: `${ws} · the AI is reading this source.`,
        href: `/workspaces/${k.workspaceId}/knowledge-base`,
        tone: 'pending',
        createdAt: relative(k.createdAt),
      });
    }
  }

  for (const g of recentGens) {
    const ws = wsName.get(g.workspaceId) ?? 'Workspace';
    out.push({
      id: `gen-${g.id}`,
      title: g.currentPngPath ? `Banner ready: ${g.title}` : `New banner: ${g.title}`,
      body: g.isTemplate ? `${ws} · marked as template` : `${ws} · last updated`,
      href: `/workspaces/${g.workspaceId}/generations/${g.id}`,
      tone: g.currentPngPath ? 'success' : 'info',
      createdAt: relative(g.updatedAt),
    });
  }

  const total = Number(costRow?.total ?? 0);
  if (total > 1) {
    out.push({
      id: 'cost-day',
      title: `$${total.toFixed(2)} spent on AI in the last 24h`,
      body: 'Tap to review activity and per-workspace cost.',
      href: '/workspaces',
      tone: 'info',
      createdAt: '24h',
    });
  }

  return out.slice(0, 8);
}
