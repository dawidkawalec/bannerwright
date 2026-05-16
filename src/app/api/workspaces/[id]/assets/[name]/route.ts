import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/current-user';
import { getWorkspaceForUser } from '@/lib/db/queries/workspaces';
import { getStorage, storageKeys } from '@/lib/storage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MIME_BY_EXT: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
};

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string; name: string }> },
) {
  const { user } = await getSession();
  if (!user) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

  const { id, name } = await ctx.params;

  // Reject anything that could escape the generated/ directory.
  if (!/^[\w.\-]+$/.test(name)) {
    return NextResponse.json({ error: 'invalid name' }, { status: 400 });
  }

  const ws = await getWorkspaceForUser(id, user.id);
  if (!ws) return NextResponse.json({ error: 'not found' }, { status: 404 });

  try {
    const buffer = await getStorage().get(storageKeys.generated(id, name));
    const ext = name.split('.').pop()?.toLowerCase() ?? 'png';
    return new NextResponse(buffer as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': MIME_BY_EXT[ext] ?? 'application/octet-stream',
        'Cache-Control': 'private, max-age=300',
      },
    });
  } catch {
    return NextResponse.json({ error: 'asset missing' }, { status: 404 });
  }
}
