import { z } from 'zod';

export const formats = [
  'square_1080',
  'story_1080_1920',
  'landscape_1200_628',
  'portrait_1200_1500',
] as const;

export const formatLabels: Record<(typeof formats)[number], string> = {
  square_1080: 'Square 1080×1080 (IG / FB post)',
  story_1080_1920: 'Story 1080×1920 (IG / Reels cover)',
  landscape_1200_628: 'Landscape 1200×628 (FB / LinkedIn link)',
  portrait_1200_1500: 'Portrait 1200×1500 (IG portrait)',
};

export const generateBriefSchema = z.object({
  workspaceId: z.string().uuid(),
  format: z.enum(formats),
  brief: z.string().min(3).max(2_000).trim(),
  title: z.string().max(120).optional(),
});

export type GenerateBriefInput = z.infer<typeof generateBriefSchema>;
