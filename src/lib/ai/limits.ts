import { gte, sql } from 'drizzle-orm';
import { db } from '../db/client';
import { generations, llmUsage } from '../db/schema';
import { env } from '../env';

const dayMs = 24 * 60 * 60 * 1000;

export type CapStatus = {
  generationsToday: number;
  costUsdToday: number;
  generationsCap: number;
  costUsdCap: number;
};

export async function getDailyUsage(): Promise<CapStatus> {
  const since = new Date(Date.now() - dayMs);

  const [genRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(generations)
    .where(gte(generations.createdAt, since));

  const [costRow] = await db
    .select({
      total: sql<string>`COALESCE(SUM(${llmUsage.costUsd}), 0)::text`,
    })
    .from(llmUsage)
    .where(gte(llmUsage.createdAt, since));

  return {
    generationsToday: genRow?.count ?? 0,
    costUsdToday: Number(costRow?.total ?? '0'),
    generationsCap: env.MAX_GENERATIONS_PER_DAY,
    costUsdCap: env.MAX_LLM_COST_USD_PER_DAY,
  };
}

export class DailyCapExceeded extends Error {
  constructor(public readonly which: 'generations' | 'cost', public readonly status: CapStatus) {
    super(
      which === 'generations'
        ? `Daily generation cap reached: ${status.generationsToday}/${status.generationsCap}. Raise MAX_GENERATIONS_PER_DAY in .env to continue.`
        : `Daily LLM-cost cap reached: $${status.costUsdToday.toFixed(2)} / $${status.costUsdCap.toFixed(2)}. Raise MAX_LLM_COST_USD_PER_DAY in .env to continue.`,
    );
    this.name = 'DailyCapExceeded';
  }
}

/**
 * Throws {@link DailyCapExceeded} if either cap is hit. Cheap to call (two
 * count queries against indexed columns).
 */
export async function assertWithinDailyCaps(opts?: { newGeneration?: boolean }) {
  const status = await getDailyUsage();
  if (opts?.newGeneration && status.generationsToday >= status.generationsCap) {
    throw new DailyCapExceeded('generations', status);
  }
  if (status.costUsdToday >= status.costUsdCap) {
    throw new DailyCapExceeded('cost', status);
  }
}
