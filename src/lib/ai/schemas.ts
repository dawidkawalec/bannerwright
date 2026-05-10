import { z } from 'zod';

const hexColor = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a 6-digit hex like #1F2937');

export const brandTones = [
  'professional',
  'casual',
  'playful',
  'luxury',
  'minimalist',
  'bold',
  'friendly',
  'technical',
] as const;

export const brandExtractionSchema = z.object({
  primaryColor: hexColor,
  secondaryColor: hexColor.optional(),
  accentColor: hexColor.optional(),
  backgroundColor: hexColor.optional(),
  textColor: hexColor.optional(),
  headlineFont: z.string().min(1).max(60),
  bodyFont: z.string().min(1).max(60),
  brandTone: z.enum(brandTones),
  industry: z.string().min(1).max(60),
  keyMessages: z.array(z.string().min(1).max(160)).min(1).max(5),
  tagline: z.string().max(160).optional(),
});

export type BrandExtraction = z.infer<typeof brandExtractionSchema>;

/**
 * Hand-rolled JSON Schema for Gemini structured output (the SDK accepts a
 * subset of OpenAPI; mapping it from Zod by hand keeps types honest).
 */
export const brandExtractionJsonSchema = {
  type: 'object',
  properties: {
    primaryColor: { type: 'string', pattern: '^#[0-9A-Fa-f]{6}$' },
    secondaryColor: { type: 'string', pattern: '^#[0-9A-Fa-f]{6}$' },
    accentColor: { type: 'string', pattern: '^#[0-9A-Fa-f]{6}$' },
    backgroundColor: { type: 'string', pattern: '^#[0-9A-Fa-f]{6}$' },
    textColor: { type: 'string', pattern: '^#[0-9A-Fa-f]{6}$' },
    headlineFont: { type: 'string' },
    bodyFont: { type: 'string' },
    brandTone: { type: 'string', enum: [...brandTones] },
    industry: { type: 'string' },
    keyMessages: { type: 'array', items: { type: 'string' }, minItems: 1, maxItems: 5 },
    tagline: { type: 'string' },
  },
  required: ['primaryColor', 'headlineFont', 'bodyFont', 'brandTone', 'industry', 'keyMessages'],
} as const;
