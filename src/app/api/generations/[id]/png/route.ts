import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/current-user';
import {
  getGeneration,
  updateGenerationCurrentHtml,
} from '@/lib/db/queries/generations';
import { getWorkspaceForUser } from '@/lib/db/queries/workspaces';
import type { Generation } from '@/lib/db/schema';
import { logger } from '@/lib/logger';
import { renderHtmlToPng, type RenderInput } from '@/lib/renderer/render-png';
import { getStorage } from '@/lib/storage';

function renderSourceFrom(generation: Generation): Pick<RenderInput, 'tree' | 'html'> | null {
  if (generation.currentTree) return { tree: generation.currentTree };
  if (generation.currentHtml) return { html: generation.currentHtml };
  return null;
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { user } = await getSession();
  if (!user) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

  const { id } = await ctx.params;
  const generation = await getGeneration(id);
  if (!generation) return NextResponse.json({ error: 'not found' }, { status: 404 });

  const workspace = await getWorkspaceForUser(generation.workspaceId, user.id);
  if (!workspace) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  let pngKey = generation.currentPngPath ?? undefined;
  const storage = getStorage();

  if (pngKey) {
    try {
      const buf = await storage.get(pngKey);
      return new NextResponse(buf as unknown as BodyInit, {
        status: 200,
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'private, max-age=60',
        },
      });
    } catch (err) {
      logger.warn({ err, key: pngKey }, 'cached png missing — re-rendering');
      pngKey = undefined;
    }
  }

  // On-demand render.
  const source = renderSourceFrom(generation);
  if (!source) {
    return NextResponse.json({ error: 'generation has no renderable content' }, { status: 422 });
  }
  try {
    const rendered = await renderHtmlToPng({
      ...source,
      format: generation.format,
      generationId: generation.id,
    });
    await updateGenerationCurrentHtml(
      generation.id,
      generation.currentHtml ?? '',
      rendered.pngKey,
    );
    const buf = await storage.get(rendered.pngKey);
    return new NextResponse(buf as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'private, max-age=60',
      },
    });
  } catch (err) {
    logger.error({ err, generationId: id }, 'on-demand render failed');
    return NextResponse.json({ error: 'render failed' }, { status: 500 });
  }
}

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  // Force re-render of current HTML (e.g. after manual edit; full editor lands in Faza 3).
  const { user } = await getSession();
  if (!user) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

  const { id } = await ctx.params;
  const generation = await getGeneration(id);
  if (!generation) return NextResponse.json({ error: 'not found' }, { status: 404 });

  const workspace = await getWorkspaceForUser(generation.workspaceId, user.id);
  if (!workspace) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const source = renderSourceFrom(generation);
  if (!source) {
    return NextResponse.json({ error: 'generation has no renderable content' }, { status: 422 });
  }
  const rendered = await renderHtmlToPng({
    ...source,
    format: generation.format,
    generationId: generation.id,
  });
  await updateGenerationCurrentHtml(
    generation.id,
    generation.currentHtml ?? '',
    rendered.pngKey,
  );
  return NextResponse.json({ ok: true, pngKey: rendered.pngKey });
}
