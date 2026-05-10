import { and, desc, eq } from 'drizzle-orm';
import { db } from '../client';
import { workspaces, type NewWorkspace, type Workspace } from '../schema';

export async function listWorkspacesByUser(userId: string): Promise<Workspace[]> {
  return db
    .select()
    .from(workspaces)
    .where(eq(workspaces.userId, userId))
    .orderBy(desc(workspaces.updatedAt));
}

export async function getWorkspaceForUser(
  id: string,
  userId: string,
): Promise<Workspace | null> {
  const [row] = await db
    .select()
    .from(workspaces)
    .where(and(eq(workspaces.id, id), eq(workspaces.userId, userId)));
  return row ?? null;
}

export async function getWorkspaceBySlug(
  slug: string,
  userId: string,
): Promise<Workspace | null> {
  const [row] = await db
    .select()
    .from(workspaces)
    .where(and(eq(workspaces.slug, slug), eq(workspaces.userId, userId)));
  return row ?? null;
}

export async function insertWorkspace(values: NewWorkspace): Promise<Workspace> {
  const [row] = await db.insert(workspaces).values(values).returning();
  return row!;
}

export async function updateWorkspaceById(
  id: string,
  userId: string,
  values: Partial<NewWorkspace>,
): Promise<Workspace | null> {
  const [row] = await db
    .update(workspaces)
    .set({ ...values, updatedAt: new Date() })
    .where(and(eq(workspaces.id, id), eq(workspaces.userId, userId)))
    .returning();
  return row ?? null;
}

export async function deleteWorkspaceById(id: string, userId: string): Promise<boolean> {
  const result = await db
    .delete(workspaces)
    .where(and(eq(workspaces.id, id), eq(workspaces.userId, userId)))
    .returning({ id: workspaces.id });
  return result.length > 0;
}
