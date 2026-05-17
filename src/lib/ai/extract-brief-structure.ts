import { generateContent } from './gemini';
import { logger } from '../logger';

export type BriefStructure = {
  headline: string;
  subhead?: string;
  cta?: string;
};

const SYSTEM = `You split a free-form creative brief into three banner copy slots:
- headline: the single most prominent line (5-12 words typical, can be shorter)
- subhead: a supporting line that elaborates or qualifies (optional)
- cta: a 1-4 word call-to-action button label (optional)

Hard rules:
1. PRESERVE the original language. Polish in → Polish out, English in → English out, etc. NEVER translate.
2. PRESERVE every diacritic exactly as written (ą ę ć ł ó ś ż ź ń, accented Romance characters, Cyrillic, etc.).
3. Quote the user's wording where you can — do NOT paraphrase unless you must shorten the CTA.
4. If the brief is a single short line, return only the headline; leave subhead and cta omitted.
5. If you cannot extract a clear CTA (no verb-led action), omit it rather than inventing one.
6. Output ONLY the JSON document, no prose, no markdown fences.`;

const SCHEMA = {
  type: 'object',
  properties: {
    headline: { type: 'string', description: 'Primary banner text — preserve language and diacritics literally.' },
    subhead: { type: 'string', description: 'Optional supporting line. Preserve language.' },
    cta: { type: 'string', description: 'Optional 1-4 word action button label. Preserve language.' },
  },
  required: ['headline'],
};

/**
 * Split a free-form brief into { headline, subhead, cta } via a cheap Flash call.
 * Falls back to a deterministic heuristic if the model call or parsing fails so
 * the calling generation pipeline can always make progress.
 */
export async function extractBriefStructure(
  brief: string,
  workspaceId?: string,
): Promise<BriefStructure> {
  const trimmed = brief.trim();
  if (!trimmed) return { headline: '' };

  try {
    const result = await generateContent({
      model: 'gemini-3.1-flash-preview',
      operation: 'extract_brief',
      workspaceId,
      systemInstruction: SYSTEM,
      contents: [{ role: 'user', parts: [{ text: trimmed }] }],
      responseSchema: SCHEMA,
    });

    const parsed = JSON.parse(stripFences(result.text)) as Partial<BriefStructure>;
    if (typeof parsed.headline === 'string' && parsed.headline.trim().length > 0) {
      return {
        headline: parsed.headline.trim(),
        subhead: nonEmpty(parsed.subhead),
        cta: nonEmpty(parsed.cta),
      };
    }
    logger.warn({ parsed }, 'extractBriefStructure: model returned no headline; falling back');
  } catch (err) {
    logger.warn({ err }, 'extractBriefStructure failed; using heuristic fallback');
  }

  return heuristicSplit(trimmed);
}

/**
 * Deterministic last-resort split: first sentence = headline, last short
 * sentence with action verb or "→" = cta, middle (if any) = subhead.
 */
function heuristicSplit(brief: string): BriefStructure {
  const sentences = brief
    .split(/(?:\n+|[.!?]+\s+|\s+[—–-]\s+)/u)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  if (sentences.length === 0) return { headline: brief };
  if (sentences.length === 1) return { headline: sentences[0]! };

  const headline = sentences[0]!;
  const last = sentences[sentences.length - 1]!;
  const looksLikeCta = last.length <= 32 && (
    /^(?:→|->|→)/.test(last) ||
    /\b(?:zamów|sprawdź|kup|kliknij|pobierz|wypróbuj|umów|zapisz|dołącz|odbierz|zacznij|get|buy|try|book|start|learn|join|claim|shop|order|sign|sign\s?up)\b/iu.test(last)
  );

  if (looksLikeCta && sentences.length >= 2) {
    return {
      headline,
      subhead: sentences.length > 2 ? sentences.slice(1, -1).join('. ') : undefined,
      cta: last,
    };
  }

  return {
    headline,
    subhead: sentences.slice(1).join('. '),
  };
}

function nonEmpty(s: string | undefined): string | undefined {
  if (typeof s !== 'string') return undefined;
  const trimmed = s.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function stripFences(text: string): string {
  const trimmed = text.trim();
  const fenceMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)```$/i);
  return fenceMatch ? fenceMatch[1]!.trim() : trimmed;
}
