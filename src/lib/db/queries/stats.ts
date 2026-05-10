import { and, count, desc, eq, gte, sql, sum } from 'drizzle-orm';
import { db } from '../client';
import {
  generations,
  kbSources,
  llmUsage,
  workspaces,
  type Generation,
} from '../schema';

export type GlobalStats = {
  workspaces: number;
  generations: number;
  totalCostUsd: number;
  kbSources: number;
};

export async function getGlobalStats(userId: string): Promise<GlobalStats> {
  const [wsCountRow] = await db
    .select({ value: count() })
    .from(workspaces)
    .where(eq(workspaces.userId, userId));

  const [genCountRow] = await db
    .select({ value: count() })
    .from(generations)
    .innerJoin(workspaces, eq(generations.workspaceId, workspaces.id))
    .where(eq(workspaces.userId, userId));

  const [costRow] = await db
    .select({ value: sum(llmUsage.costUsd) })
    .from(llmUsage)
    .innerJoin(workspaces, eq(llmUsage.workspaceId, workspaces.id))
    .where(eq(workspaces.userId, userId));

  const [kbCountRow] = await db
    .select({ value: count() })
    .from(kbSources)
    .innerJoin(workspaces, eq(kbSources.workspaceId, workspaces.id))
    .where(eq(workspaces.userId, userId));

  return {
    workspaces: Number(wsCountRow?.value ?? 0),
    generations: Number(genCountRow?.value ?? 0),
    totalCostUsd: Number(costRow?.value ?? 0),
    kbSources: Number(kbCountRow?.value ?? 0),
  };
}

export type WorkspaceStats = {
  generations: number;
  templates: number;
  kbSources: number;
  totalCostUsd: number;
};

export async function getWorkspaceStats(workspaceId: string): Promise<WorkspaceStats> {
  const [genCountRow] = await db
    .select({ value: count() })
    .from(generations)
    .where(eq(generations.workspaceId, workspaceId));

  const [tplCountRow] = await db
    .select({ value: count() })
    .from(generations)
    .where(and(eq(generations.workspaceId, workspaceId), eq(generations.isTemplate, true)));

  const [kbCountRow] = await db
    .select({ value: count() })
    .from(kbSources)
    .where(eq(kbSources.workspaceId, workspaceId));

  const [costRow] = await db
    .select({ value: sum(llmUsage.costUsd) })
    .from(llmUsage)
    .where(eq(llmUsage.workspaceId, workspaceId));

  return {
    generations: Number(genCountRow?.value ?? 0),
    templates: Number(tplCountRow?.value ?? 0),
    kbSources: Number(kbCountRow?.value ?? 0),
    totalCostUsd: Number(costRow?.value ?? 0),
  };
}

export type TimeseriesPoint = { date: string; count: number; costUsd: number };

export async function getGenerationsTimeseries(opts: {
  userId: string;
  workspaceId?: string;
  days?: number;
}): Promise<TimeseriesPoint[]> {
  const days = opts.days ?? 30;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const dateExpr = sql<string>`to_char(date_trunc('day', ${generations.createdAt}), 'YYYY-MM-DD')`;

  const rows = await db
    .select({
      date: dateExpr,
      count: count(generations.id),
    })
    .from(generations)
    .innerJoin(workspaces, eq(generations.workspaceId, workspaces.id))
    .where(
      and(
        eq(workspaces.userId, opts.userId),
        opts.workspaceId ? eq(generations.workspaceId, opts.workspaceId) : undefined,
        gte(generations.createdAt, since),
      ),
    )
    .groupBy(dateExpr)
    .orderBy(dateExpr);

  // Cost timeseries (separate query — llm_usage may not match generations day-for-day)
  const costDateExpr = sql<string>`to_char(date_trunc('day', ${llmUsage.createdAt}), 'YYYY-MM-DD')`;
  const costRows = await db
    .select({
      date: costDateExpr,
      cost: sum(llmUsage.costUsd),
    })
    .from(llmUsage)
    .innerJoin(workspaces, eq(llmUsage.workspaceId, workspaces.id))
    .where(
      and(
        eq(workspaces.userId, opts.userId),
        opts.workspaceId ? eq(llmUsage.workspaceId, opts.workspaceId) : undefined,
        gte(llmUsage.createdAt, since),
      ),
    )
    .groupBy(costDateExpr)
    .orderBy(costDateExpr);

  const costMap = new Map<string, number>();
  for (const r of costRows) costMap.set(r.date, Number(r.cost ?? 0));

  // Build a complete day series so charts don't have gaps
  const out: TimeseriesPoint[] = [];
  const countMap = new Map<string, number>();
  for (const r of rows) countMap.set(r.date, Number(r.count));

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().slice(0, 10);
    out.push({
      date: key,
      count: countMap.get(key) ?? 0,
      costUsd: costMap.get(key) ?? 0,
    });
  }
  return out;
}

export type RecentGenerationRow = Pick<
  Generation,
  | 'id'
  | 'title'
  | 'format'
  | 'workspaceId'
  | 'thumbnailPath'
  | 'currentPngPath'
  | 'isTemplate'
  | 'createdAt'
  | 'updatedAt'
> & { workspaceName: string };

export async function getRecentGenerations(opts: {
  userId: string;
  workspaceId?: string;
  limit?: number;
}): Promise<RecentGenerationRow[]> {
  const limit = opts.limit ?? 8;
  const rows = await db
    .select({
      id: generations.id,
      title: generations.title,
      format: generations.format,
      workspaceId: generations.workspaceId,
      thumbnailPath: generations.thumbnailPath,
      currentPngPath: generations.currentPngPath,
      isTemplate: generations.isTemplate,
      createdAt: generations.createdAt,
      updatedAt: generations.updatedAt,
      workspaceName: workspaces.name,
    })
    .from(generations)
    .innerJoin(workspaces, eq(generations.workspaceId, workspaces.id))
    .where(
      and(
        eq(workspaces.userId, opts.userId),
        opts.workspaceId ? eq(generations.workspaceId, opts.workspaceId) : undefined,
      ),
    )
    .orderBy(desc(generations.updatedAt))
    .limit(limit);
  return rows;
}

export type WorkspaceWithStats = {
  workspaceId: string;
  generationCount: number;
  templateCount: number;
  totalCostUsd: number;
  lastGenerationAt: Date | null;
};

export async function getStatsForWorkspaces(workspaceIds: string[]): Promise<
  Map<string, WorkspaceWithStats>
> {
  const map = new Map<string, WorkspaceWithStats>();
  if (workspaceIds.length === 0) return map;

  const genRows = await db
    .select({
      workspaceId: generations.workspaceId,
      total: count(generations.id),
      templates: sql<number>`count(*) filter (where ${generations.isTemplate} = true)`,
      lastGen: sql<Date | null>`max(${generations.updatedAt})`,
    })
    .from(generations)
    .where(
      sql`${generations.workspaceId} in (${sql.join(
        workspaceIds.map((id) => sql`${id}::uuid`),
        sql`, `,
      )})`,
    )
    .groupBy(generations.workspaceId);

  const costRows = await db
    .select({
      workspaceId: llmUsage.workspaceId,
      cost: sum(llmUsage.costUsd),
    })
    .from(llmUsage)
    .where(
      sql`${llmUsage.workspaceId} in (${sql.join(
        workspaceIds.map((id) => sql`${id}::uuid`),
        sql`, `,
      )})`,
    )
    .groupBy(llmUsage.workspaceId);

  for (const id of workspaceIds) {
    map.set(id, {
      workspaceId: id,
      generationCount: 0,
      templateCount: 0,
      totalCostUsd: 0,
      lastGenerationAt: null,
    });
  }
  for (const r of genRows) {
    const entry = map.get(r.workspaceId);
    if (!entry) continue;
    entry.generationCount = Number(r.total);
    entry.templateCount = Number(r.templates);
    entry.lastGenerationAt = r.lastGen;
  }
  for (const r of costRows) {
    if (!r.workspaceId) continue;
    const entry = map.get(r.workspaceId);
    if (!entry) continue;
    entry.totalCostUsd = Number(r.cost ?? 0);
  }
  return map;
}
