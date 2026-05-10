import type { Content } from '@google/genai';
import type { ChatMessage, GenerationFormat } from '@/lib/db/schema';
import { dimensionsFor } from '@/lib/renderer/formats';

export const EDIT_HTML_SYSTEM = `You are Bannerwright's HTML editor. You receive an existing banner HTML, recent chat history, and a new instruction. Return the FULL modified HTML.

Hard rules:
1. Output ONE complete HTML document starting with <!DOCTYPE html>. Nothing before or after </html>.
2. Inline CSS only inside a single <style> tag. Google Fonts via @import allowed. NO <script> tags. NO external resources except Google Fonts.
3. Preserve the viewport size, format, brand colours and layout intent UNLESS the user explicitly asks to change them.
4. Change ONLY what the user asks for. Don't refactor untouched sections. Don't "improve" things that weren't requested.
5. URLs must be absolute or data URIs.
6. **Preserve every \`data-bw-id\` attribute exactly as in the input.** These IDs anchor the visual editor to elements; if you strip or renumber them the user's selections break. If you genuinely add a new element, leave it without an ID and the next visual-mode entry will stamp one.

If the instruction is ambiguous, pick the most literal interpretation. If the instruction is impossible (asks for something that violates the rules above), return the HTML unchanged.

Reply with HTML only. No prose, no markdown fences.`;

export type EditPromptInput = {
  format: GenerationFormat;
  currentHtml: string;
  chatHistory: ChatMessage[];
  instruction: string;
  /** Optional inspiration images attached to this instruction. */
  inspirations?: Array<{ mimeType: string; bytes: Buffer }>;
};

const MAX_HISTORY = 10;

export function buildEditHtmlContents(input: EditPromptInput): Content[] {
  const { width, height } = dimensionsFor(input.format);
  const parts: Content['parts'] = [];

  parts.push({
    text: [
      `Format: ${input.format} (${width}×${height}px). Keep these exact dimensions.`,
      '',
      '--- CURRENT HTML ---',
      input.currentHtml,
      '--- END CURRENT HTML ---',
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

  parts.push({
    text: `New instruction: ${input.instruction}`,
  });

  if ((input.inspirations ?? []).length > 0) {
    parts.push({
      text: [
        `The user attached ${input.inspirations!.length} reference image${
          input.inspirations!.length === 1 ? '' : 's'
        } with this instruction. Use them as visual moodboard cues for what to`,
        'change — palette, layout, type vibe. DO NOT embed these images in the',
        'output (no data URIs from them) unless the instruction explicitly says so.',
      ].join('\n'),
    });
    for (const ref of input.inspirations!) {
      parts.push({
        inlineData: { mimeType: ref.mimeType, data: ref.bytes.toString('base64') },
      });
    }
  }

  parts.push({
    text: 'Return the full updated HTML now.',
  });

  return [{ role: 'user', parts }];
}
