import { z } from 'zod';

export const addKbUrlSchema = z.object({
  url: z
    .string()
    .url('Must be a valid URL')
    .refine((u) => /^https?:\/\//i.test(u), 'Only http(s) URLs are supported'),
});

export type AddKbUrlInput = z.infer<typeof addKbUrlSchema>;
