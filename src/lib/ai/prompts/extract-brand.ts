import type { Content } from '@google/genai';

export const EXTRACT_BRAND_SYSTEM = `You are a senior brand strategist. From the materials provided (the client's website screenshot and extracted text content), distil the brand identity.

Rules:
- Pick exact hex colours visible in the screenshot. Prefer the strongest brand colour as primaryColor; supporting accent if clearly used. Background should be the most common page background.
- For fonts, identify the headline and body typeface used on the site. If unsure, name the closest free Google Font (e.g. "Inter", "Manrope", "DM Sans", "Playfair Display"). Don't invent paid fonts.
- brandTone must be one of: professional, casual, playful, luxury, minimalist, bold, friendly, technical.
- industry: 1–3 words, lowercase (e.g. "saas", "ecommerce fashion", "fintech").
- keyMessages: 2–4 short value-prop sentences in the brand's own voice (max 160 chars each).
- tagline: optional, max 160 chars.
- Output strict JSON matching the response schema. No prose.`;

export type ExtractBrandSource = {
  title: string | null;
  url: string | null;
  description?: string | null;
  /** Up to ~10k chars of body text; truncated by caller. */
  bodyText: string;
  /** Optional inline screenshot bytes; the caller decides how many to attach. */
  screenshot?: { mimeType: string; bytes: Buffer };
};

const MAX_TEXT_PER_SOURCE = 10_000;

/**
 * Builds a multimodal prompt for `gemini-3.1-pro-preview`.
 * Caller passes the result as `contents` to lib/ai/gemini.ts.
 */
export function buildExtractBrandContents(sources: ExtractBrandSource[]): Content[] {
  const parts: Content['parts'] = [];

  for (const [index, src] of sources.entries()) {
    parts.push({
      text: [
        `--- Source ${index + 1} ---`,
        `Title: ${src.title ?? '(none)'}`,
        `URL: ${src.url ?? '(none)'}`,
        src.description ? `Meta description: ${src.description}` : null,
        '',
        'Body text:',
        src.bodyText.slice(0, MAX_TEXT_PER_SOURCE),
      ]
        .filter(Boolean)
        .join('\n'),
    });

    if (src.screenshot) {
      parts.push({
        inlineData: {
          mimeType: src.screenshot.mimeType,
          data: src.screenshot.bytes.toString('base64'),
        },
      });
    }
  }

  parts.push({
    text:
      '\nReturn the brand identity JSON now, matching the response schema exactly. ' +
      'Do not include any text outside the JSON object.',
  });

  return [{ role: 'user', parts }];
}
