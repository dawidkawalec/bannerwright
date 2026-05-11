import type { Content } from '@google/genai';
import type { ChatMessage, GenerationFormat } from '@/lib/db/schema';
import { dimensionsFor } from '@/lib/renderer/formats';
import type { BannerTree } from '@/lib/tree/types';

export const EDIT_TREE_SYSTEM = `You are Bannerwright's structured visual editor. You receive an existing banner as a JSON BannerTree, recent chat history, and a new instruction. Return the FULL modified BannerTree matching the response schema.

Hard rules:
1. Output ONE JSON document matching the schema. No prose, no markdown fences.
2. Preserve "schemaVersion": 1 and the canvas dimensions exactly.
3. Change ONLY what the user asks for. Don't refactor untouched sections. Don't "improve" things that weren't requested.
4. **Preserve every "id" exactly for nodes you keep.** IDs anchor the visual editor to elements; if you renumber them the user's selections and undo history break. If you genuinely add a new node, generate a fresh short id (e.g. "n_abc123") that does not collide.
5. Use hex colors only (e.g. "#0F172A"). No css color names, no rgba.
6. Frames keep their absolute positioning. Children fit inside their parent frame.
7. URLs must be absolute https:// or data URIs.

If the instruction is ambiguous, pick the most literal interpretation. If the instruction is impossible (asks for something that violates the rules above), return the tree unchanged.

Reply with ONLY the JSON document matching the schema.`;

export type EditTreePromptInput = {
  format: GenerationFormat;
  currentTree: BannerTree;
  chatHistory: ChatMessage[];
  instruction: string;
  inspirations?: Array<{ mimeType: string; bytes: Buffer }>;
};

const MAX_HISTORY = 10;

export function buildEditTreeContents(input: EditTreePromptInput): Content[] {
  const { width, height } = dimensionsFor(input.format);
  const parts: Content['parts'] = [];

  parts.push({
    text: [
      `Format: ${input.format} (${width}×${height}px). Keep these exact dimensions.`,
      '',
      '--- CURRENT TREE (JSON) ---',
      JSON.stringify(input.currentTree),
      '--- END CURRENT TREE ---',
    ].join('\n'),
  });

  const recent = input.chatHistory.slice(-MAX_HISTORY);
  if (recent.length > 0) {
    parts.push({
      text: [
        '--- RECENT CONVERSATION ---',
        ...recent.map((m) => `${m.role.toUpperCase()}: ${m.content}`),
        '--- END CONVERSATION ---',
      ].join('\n'),
    });
  }

  parts.push({ text: `New instruction: ${input.instruction}` });

  if ((input.inspirations ?? []).length > 0) {
    parts.push({
      text:
        `The user attached ${input.inspirations!.length} reference image${
          input.inspirations!.length === 1 ? '' : 's'
        } below. Use them as visual moodboard cues for what to change — palette, ` +
        'layout, type vibe. DO NOT embed them as image fills in the output unless the ' +
        'instruction explicitly says so.',
    });
    for (const ref of input.inspirations!) {
      parts.push({
        inlineData: { mimeType: ref.mimeType, data: ref.bytes.toString('base64') },
      });
    }
  }

  parts.push({ text: 'Return the full updated BannerTree JSON now.' });

  return [{ role: 'user', parts }];
}
