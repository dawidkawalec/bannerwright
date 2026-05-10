/**
 * Pricing per 1M tokens (USD). Update when Google changes prices.
 * Source: https://ai.google.dev/pricing (verify before billing changes)
 */
export type ModelId =
  | 'gemini-3.1-pro-preview'
  | 'gemini-3.1-flash-preview'
  | 'gemini-3-pro-image-preview' // Nano Banana Pro
  | 'gemini-3.1-flash-image-preview'; // Nano Banana 2

type Pricing = {
  inputPerMillion: number;
  outputPerMillion: number;
  /** For image-gen models, fallback flat per-image cost (USD). */
  perImage?: number;
};

export const MODEL_PRICING: Record<ModelId, Pricing> = {
  'gemini-3.1-pro-preview': { inputPerMillion: 2.0, outputPerMillion: 12.0 },
  'gemini-3.1-flash-preview': { inputPerMillion: 0.15, outputPerMillion: 0.6 },
  'gemini-3-pro-image-preview': { inputPerMillion: 0, outputPerMillion: 0, perImage: 0.04 },
  'gemini-3.1-flash-image-preview': { inputPerMillion: 0, outputPerMillion: 0, perImage: 0.01 },
};

export function computeCostUsd(
  model: ModelId,
  inputTokens: number,
  outputTokens: number,
  imageCount = 0,
): number {
  const p = MODEL_PRICING[model];
  const tokenCost =
    (inputTokens / 1_000_000) * p.inputPerMillion +
    (outputTokens / 1_000_000) * p.outputPerMillion;
  const imageCost = (p.perImage ?? 0) * imageCount;
  return Number((tokenCost + imageCost).toFixed(6));
}
