import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/current-user';
import { getWorkspaceForUser } from '@/lib/db/queries/workspaces';
import {
  MAX_ATTACHMENTS_PER_REQUEST,
  saveAttachment,
  type SavedAttachment,
} from '@/lib/storage/attachments';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Multipart upload endpoint for AI-inspiration attachments. Accepts up to
 * MAX_ATTACHMENTS_PER_REQUEST images under the field name "files". Returns the
 * canonical storage keys the caller should pass back to the generation /
 * edit endpoints.
 */
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { user } = await getSession();
  if (!user) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

  const { id } = await ctx.params;
  const workspace = await getWorkspaceForUser(id, user.id);
  if (!workspace) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: 'Expected multipart/form-data' }, { status: 400 });
  }

  const files = form.getAll('files').filter((v): v is File => v instanceof File && v.size > 0);
  if (files.length === 0) {
    return NextResponse.json({ error: 'No files provided' }, { status: 400 });
  }
  if (files.length > MAX_ATTACHMENTS_PER_REQUEST) {
    return NextResponse.json(
      { error: `Too many files (max ${MAX_ATTACHMENTS_PER_REQUEST})` },
      { status: 400 },
    );
  }

  const saved: SavedAttachment[] = [];
  for (const file of files) {
    try {
      saved.push(await saveAttachment(workspace.id, file));
    } catch (err) {
      logger.warn({ err, name: file.name, type: file.type, size: file.size }, 'attachment rejected');
      return NextResponse.json(
        {
          error:
            err instanceof Error ? err.message : 'Could not save attachment',
        },
        { status: 400 },
      );
    }
  }

  return NextResponse.json({ attachments: saved });
}
