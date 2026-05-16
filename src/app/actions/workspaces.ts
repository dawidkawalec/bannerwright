'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth/current-user';
import {
  deleteWorkspaceById,
  getWorkspaceForUser,
  getWorkspaceBySlug,
  insertWorkspace,
  updateWorkspaceById,
} from '@/lib/db/queries/workspaces';
import { extractAndSaveBrand } from '@/lib/kb/extract-brand';
import { logger } from '@/lib/logger';
import { brandSettingsSchema } from '@/lib/schemas/brand';
import {
  ALLOWED_LOGO_TYPES,
  MAX_LOGO_BYTES,
} from '@/lib/schemas/kb';
import {
  autoSlug,
  createWorkspaceSchema,
  updateWorkspaceSchema,
} from '@/lib/schemas/workspaces';
import { getStorage, storageKeys } from '@/lib/storage';

export type ActionResult<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export async function createWorkspace(
  input: unknown,
): Promise<ActionResult<{ id: string; slug: string }>> {
  const parsed = createWorkspaceSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }
  const user = await requireUser();
  const slug = parsed.data.slug ?? autoSlug(parsed.data.name);
  if (!slug) return { ok: false, error: 'Could not derive slug from name' };

  const existing = await getWorkspaceBySlug(slug, user.id);
  if (existing) return { ok: false, error: `Slug "${slug}" already in use` };

  try {
    const ws = await insertWorkspace({
      userId: user.id,
      name: parsed.data.name,
      slug,
      description: parsed.data.description,
    });
    revalidatePath('/workspaces');
    return { ok: true, data: { id: ws.id, slug: ws.slug } };
  } catch (err) {
    logger.error({ err }, 'createWorkspace failed');
    return { ok: false, error: 'Could not create workspace' };
  }
}

export async function onboardWorkspace(
  input: unknown,
): Promise<ActionResult<{ id: string; slug: string; queuedKbSourceId?: string }>> {
  const parsed = createWorkspaceSchema.safeParse(
    typeof input === 'object' && input
      ? { name: (input as { name?: string }).name, slug: (input as { slug?: string }).slug }
      : input,
  );
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }
  const rawUrl = typeof input === 'object' && input ? (input as { url?: string }).url : undefined;
  const trimmedUrl = (rawUrl ?? '').trim();
  let parsedUrl: URL | undefined;
  if (trimmedUrl) {
    try {
      parsedUrl = new URL(trimmedUrl);
      if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
        return { ok: false, error: 'URL must use http or https' };
      }
    } catch {
      return { ok: false, error: 'URL is not valid' };
    }
  }

  const user = await requireUser();
  const slug = parsed.data.slug ?? autoSlug(parsed.data.name);
  if (!slug) return { ok: false, error: 'Could not derive slug from name' };
  const existing = await getWorkspaceBySlug(slug, user.id);
  if (existing) return { ok: false, error: `Slug "${slug}" already in use` };

  try {
    const ws = await insertWorkspace({
      userId: user.id,
      name: parsed.data.name,
      slug,
      description: parsed.data.description,
    });

    let queuedKbSourceId: string | undefined;
    if (parsedUrl) {
      const { insertKbSourceUrl } = await import('@/lib/db/queries/kb');
      const { processKbUrl } = await import('@/lib/kb/process-url');
      try {
        const source = await insertKbSourceUrl(ws.id, parsedUrl.toString());
        queuedKbSourceId = source.id;
        void processKbUrl(source.id).catch((err) =>
          logger.error({ err, sourceId: source.id }, 'onboarding kb worker rejected'),
        );
      } catch (err) {
        // Workspace already created — KB attach failure is non-fatal at onboarding.
        logger.warn({ err, workspaceId: ws.id }, 'onboarding KB source insert failed');
      }
    }

    revalidatePath('/workspaces');
    return { ok: true, data: { id: ws.id, slug: ws.slug, queuedKbSourceId } };
  } catch (err) {
    logger.error({ err }, 'onboardWorkspace failed');
    return { ok: false, error: 'Could not create workspace' };
  }
}

export type GeneratedAsset = {
  name: string;
  size: number;
  createdAt: number;
};

export async function listGeneratedAssets(
  workspaceId: string,
): Promise<ActionResult<GeneratedAsset[]>> {
  const user = await requireUser();
  const ws = await getWorkspaceForUser(workspaceId, user.id);
  if (!ws) return { ok: false, error: 'Workspace not found' };
  try {
    const entries = await getStorage().list(`workspaces/${workspaceId}/generated`);
    return {
      ok: true,
      data: entries.map((e) => ({
        name: e.key.split('/').pop() ?? e.key,
        size: e.size,
        createdAt: e.mtimeMs,
      })),
    };
  } catch (err) {
    logger.error({ err, workspaceId }, 'listGeneratedAssets failed');
    return { ok: false, error: 'Could not list assets' };
  }
}

export async function deleteGeneratedAsset(
  workspaceId: string,
  name: string,
): Promise<ActionResult<true>> {
  const user = await requireUser();
  const ws = await getWorkspaceForUser(workspaceId, user.id);
  if (!ws) return { ok: false, error: 'Workspace not found' };
  // Reject path traversal and non-asset names.
  if (!/^[\w.\-]+$/.test(name)) return { ok: false, error: 'Invalid asset name' };
  try {
    await getStorage().delete(storageKeys.generated(workspaceId, name));
    revalidatePath(`/workspaces/${workspaceId}/assets`);
    return { ok: true, data: true };
  } catch (err) {
    logger.error({ err, workspaceId, name }, 'deleteGeneratedAsset failed');
    return { ok: false, error: 'Could not delete asset' };
  }
}

export async function updateWorkspace(
  id: string,
  input: unknown,
): Promise<ActionResult<true>> {
  const parsed = updateWorkspaceSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }
  const user = await requireUser();
  const updated = await updateWorkspaceById(id, user.id, parsed.data);
  if (!updated) return { ok: false, error: 'Workspace not found' };
  revalidatePath('/workspaces');
  revalidatePath(`/workspaces/${id}`);
  return { ok: true, data: true };
}

export async function updateBrand(
  workspaceId: string,
  input: unknown,
): Promise<ActionResult<true>> {
  const parsed = brandSettingsSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid brand input' };
  }
  const user = await requireUser();
  const ws = await getWorkspaceForUser(workspaceId, user.id);
  if (!ws) return { ok: false, error: 'Workspace not found' };

  const { headlineFont, bodyFont, ...colorFields } = parsed.data;
  const updated = await updateWorkspaceById(workspaceId, user.id, {
    brandColors: {
      primary: colorFields.primary,
      secondary: colorFields.secondary,
      accent: colorFields.accent,
      background: colorFields.background,
      text: colorFields.text,
    },
    brandFonts: { headline: headlineFont, body: bodyFont },
  });
  if (!updated) return { ok: false, error: 'Could not update brand' };
  revalidatePath(`/workspaces/${workspaceId}/settings`);
  revalidatePath(`/workspaces/${workspaceId}`);
  return { ok: true, data: true };
}

export async function uploadLogo(
  workspaceId: string,
  formData: FormData,
): Promise<ActionResult<{ logoUrl: string }>> {
  const user = await requireUser();
  const ws = await getWorkspaceForUser(workspaceId, user.id);
  if (!ws) return { ok: false, error: 'Workspace not found' };

  const file = formData.get('logo');
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: 'No file uploaded' };
  }
  if (file.size > MAX_LOGO_BYTES) {
    return { ok: false, error: `Logo must be under ${MAX_LOGO_BYTES / 1024 / 1024} MB` };
  }
  if (!ALLOWED_LOGO_TYPES.includes(file.type as (typeof ALLOWED_LOGO_TYPES)[number])) {
    return { ok: false, error: 'Logo must be PNG, JPEG, WebP or SVG' };
  }

  const ext = file.type === 'image/svg+xml' ? 'svg' : file.type.split('/')[1];
  const key = storageKeys.workspaceLogo(workspaceId, ext ?? 'png');
  const buf = Buffer.from(await file.arrayBuffer());
  await getStorage().put(key, buf, file.type);

  await updateWorkspaceById(workspaceId, user.id, { logoUrl: key });
  revalidatePath(`/workspaces/${workspaceId}/settings`);
  revalidatePath(`/workspaces/${workspaceId}`);
  return { ok: true, data: { logoUrl: key } };
}

export async function removeLogo(
  workspaceId: string,
): Promise<ActionResult<true>> {
  const user = await requireUser();
  const ws = await getWorkspaceForUser(workspaceId, user.id);
  if (!ws) return { ok: false, error: 'Workspace not found' };
  if (ws.logoUrl) {
    await getStorage()
      .delete(ws.logoUrl)
      .catch((err) => logger.warn({ err, key: ws.logoUrl }, 'logo delete failed'));
  }
  await updateWorkspaceById(workspaceId, user.id, { logoUrl: null });
  revalidatePath(`/workspaces/${workspaceId}/settings`);
  revalidatePath(`/workspaces/${workspaceId}`);
  return { ok: true, data: true };
}

export async function autoDetectBrand(
  workspaceId: string,
): Promise<ActionResult<true>> {
  const user = await requireUser();
  const ws = await getWorkspaceForUser(workspaceId, user.id);
  if (!ws) return { ok: false, error: 'Workspace not found' };

  try {
    await extractAndSaveBrand(workspaceId);
    revalidatePath(`/workspaces/${workspaceId}/settings`);
    revalidatePath(`/workspaces/${workspaceId}`);
    return { ok: true, data: true };
  } catch (err) {
    logger.error({ err, workspaceId }, 'autoDetectBrand failed');
    const msg = err instanceof Error ? err.message : 'Brand detection failed';
    return { ok: false, error: msg };
  }
}

export async function deleteWorkspace(id: string): Promise<ActionResult<true>> {
  const user = await requireUser();
  const ok = await deleteWorkspaceById(id, user.id);
  if (!ok) return { ok: false, error: 'Workspace not found' };
  revalidatePath('/workspaces');
  redirect('/workspaces');
}
