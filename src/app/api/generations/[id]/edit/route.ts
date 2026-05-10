import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth/current-user';
import { getGeneration } from '@/lib/db/queries/generations';
import { getWorkspaceForUser } from '@/lib/db/queries/workspaces';
import { runEdit, type EditEvent } from '@/lib/generation/edit';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

const inputSchema = z.object({
  instruction: z.string().min(1).max(2_000),
  attachmentKeys: z.array(z.string().max(300)).max(5).optional(),
});

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { user } = await getSession();
  if (!user) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

  const { id } = await ctx.params;
  const generation = await getGeneration(id);
  if (!generation) return NextResponse.json({ error: 'not found' }, { status: 404 });

  const workspace = await getWorkspaceForUser(generation.workspaceId, user.id);
  if (!workspace) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const parsed = inputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid input' },
      { status: 400 },
    );
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: EditEvent) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        } catch {
          /* closed */
        }
      };
      try {
        await runEdit(
          {
            userId: user.id,
            workspaceId: workspace.id,
            generationId: id,
            instruction: parsed.data.instruction,
            attachmentKeys: parsed.data.attachmentKeys,
          },
          send,
        );
      } catch (err) {
        logger.error({ err, generationId: id }, 'edit failed');
        send({
          type: 'error',
          message: err instanceof Error ? err.message : 'Edit failed',
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
