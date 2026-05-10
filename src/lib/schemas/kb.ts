import { z } from 'zod';

export const addKbUrlSchema = z.object({
  url: z
    .string()
    .url('Must be a valid URL')
    .refine((u) => /^https?:\/\//i.test(u), 'Only http(s) URLs are supported'),
});

export type AddKbUrlInput = z.infer<typeof addKbUrlSchema>;

export const addKbTextSchema = z.object({
  title: z.string().min(1).max(120).trim(),
  text: z.string().min(1).max(50_000),
});

export type AddKbTextInput = z.infer<typeof addKbTextSchema>;

export const ALLOWED_LOGO_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/svg+xml',
] as const;

export const MAX_LOGO_BYTES = 2 * 1024 * 1024; // 2 MB
