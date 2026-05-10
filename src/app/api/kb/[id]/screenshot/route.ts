import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/current-user';
import { getKbSource } from '@/lib/db/queries/kb';
import { getWorkspaceForUser } from '@/lib/db/queries/workspaces';
import { getStorage } from '@/lib/storage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { user } = await getSession();
  if (!user) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

  const { id } = await ctx.params;
  const source = await getKbSource(id);
  if (!source || !source.screenshotPath) {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }

  // Authz: must own the workspace.
  const workspace = await getWorkspaceForUser(source.workspaceId, user.id);
  if (!workspace) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  try {
    const buffer = await getStorage().get(source.screenshotPath);
    return new NextResponse(buffer as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'private, max-age=300',
      },
    });
  } catch {
    return NextResponse.json({ error: 'screenshot missing on disk' }, { status: 404 });
  }
}
