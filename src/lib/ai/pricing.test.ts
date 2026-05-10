import { describe, expect, it } from 'vitest';
import { computeCostUsd } from './pricing';

describe('computeCostUsd', () => {
  it('Pro: 1M input + 100k output = $2 + $1.20', () => {
    expect(computeCostUsd('gemini-3.1-pro-preview', 1_000_000, 100_000)).toBeCloseTo(3.2, 4);
  });

  it('Flash: cheap', () => {
    expect(computeCostUsd('gemini-3.1-flash-preview', 1_000_000, 1_000_000)).toBeCloseTo(0.75, 4);
  });

  it('Nano Banana Pro: per-image cost', () => {
    expect(computeCostUsd('gemini-3-pro-image-preview', 0, 0, 5)).toBeCloseTo(0.2, 4);
  });

  it('zero tokens = zero cost', () => {
    expect(computeCostUsd('gemini-3.1-pro-preview', 0, 0)).toBe(0);
  });
});
