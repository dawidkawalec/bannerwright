import { z } from 'zod';

const hexColor = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, 'Use a 6-digit hex like #1F2937')
  .optional()
  .or(z.literal('').transform(() => undefined));

export const brandSettingsSchema = z.object({
  primary: hexColor,
  secondary: hexColor,
  accent: hexColor,
  background: hexColor,
  text: hexColor,
  headlineFont: z.string().max(60).optional().or(z.literal('').transform(() => undefined)),
  bodyFont: z.string().max(60).optional().or(z.literal('').transform(() => undefined)),
});

export type BrandSettingsInput = z.infer<typeof brandSettingsSchema>;
