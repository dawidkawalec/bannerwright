import type { GenerationFormat } from '../db/schema';

export const FORMAT_DIMENSIONS: Record<GenerationFormat, { width: number; height: number }> = {
  square_1080: { width: 1080, height: 1080 },
  story_1080_1920: { width: 1080, height: 1920 },
  landscape_1200_628: { width: 1200, height: 628 },
  portrait_1200_1500: { width: 1200, height: 1500 },
};

export function dimensionsFor(format: GenerationFormat) {
  return FORMAT_DIMENSIONS[format];
}
