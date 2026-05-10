import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/current-user';
import { runGeneration, type StreamEvent } from '@/lib/generation/run';
import { logger } from '@/lib/logger';
import { generateBriefSchema } from '@/lib/schemas/generations';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

export async function POST(req: Request) {
  const { user } = await getSession();
  if (!user) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = generateBriefSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid input' },
      { status: 400 },
    );
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: StreamEvent) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        } catch {
          /* controller may already be closed */
        }
      };

      try {
        await runGeneration(
          {
            userId: user.id,
            workspaceId: parsed.data.workspaceId,
            format: parsed.data.format,
            brief: parsed.data.brief,
            title: parsed.data.title,
          },
          send,
        );
      } catch (err) {
        logger.error({ err }, 'generation failed');
        send({
          type: 'error',
          message: err instanceof Error ? err.message : 'Generation failed',
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
