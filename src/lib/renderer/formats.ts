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

/** Human-readable aspect-ratio label for image-gen prompts. */
export const ASPECT_LABEL: Record<GenerationFormat, string> = {
  square_1080: '1:1 square (Instagram / Facebook post)',
  story_1080_1920: '9:16 vertical story (Instagram / TikTok story or reel cover)',
  landscape_1200_628: '1.91:1 landscape banner (Facebook / LinkedIn link preview)',
  portrait_1200_1500: '4:5 portrait post (Instagram portrait)',
};

export function aspectLabel(format: GenerationFormat) {
  return ASPECT_LABEL[format];
}
