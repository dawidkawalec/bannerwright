import { z } from 'zod';

const slugRegex = /^[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])?$/;

export const slugSchema = z
  .string()
  .min(1)
  .max(40)
  .regex(slugRegex, 'lowercase letters, digits and hyphens only');

export const createWorkspaceSchema = z.object({
  name: z.string().min(1).max(80).trim(),
  slug: slugSchema.optional(),
  description: z.string().max(500).optional(),
});

export const updateWorkspaceSchema = createWorkspaceSchema.partial();

export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;
export type UpdateWorkspaceInput = z.infer<typeof updateWorkspaceSchema>;

export function autoSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}
