import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/current-user';
import { getWorkspaceForUser } from '@/lib/db/queries/workspaces';
import { getStorage } from '@/lib/storage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MIME_BY_EXT: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  svg: 'image/svg+xml',
};

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { user } = await getSession();
  if (!user) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

  const { id } = await ctx.params;
  const ws = await getWorkspaceForUser(id, user.id);
  if (!ws || !ws.logoUrl) {
    return NextResponse.json({ error: 'no logo' }, { status: 404 });
  }

  try {
    const buffer = await getStorage().get(ws.logoUrl);
    const ext = ws.logoUrl.split('.').pop()?.toLowerCase() ?? 'png';
    return new NextResponse(buffer as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': MIME_BY_EXT[ext] ?? 'application/octet-stream',
        'Cache-Control': 'private, max-age=300',
      },
    });
  } catch {
    return NextResponse.json({ error: 'logo missing on disk' }, { status: 404 });
  }
}
