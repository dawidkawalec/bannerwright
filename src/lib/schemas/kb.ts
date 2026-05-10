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

// KB upload supports text + images out of the box. PDF needs a parser, queued.
export const ALLOWED_KB_TEXT_TYPES = ['text/plain', 'text/markdown'] as const;
export const ALLOWED_KB_IMAGE_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
] as const;
export const ALLOWED_KB_UPLOAD_TYPES = [
  ...ALLOWED_KB_TEXT_TYPES,
  ...ALLOWED_KB_IMAGE_TYPES,
] as const;
export const MAX_KB_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB
export const MAX_KB_TEXT_BYTES = 200_000; // 200 KB raw text → ~50k chars
