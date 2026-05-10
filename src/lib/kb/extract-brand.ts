import { eq } from 'drizzle-orm';
import { generateContent } from '../ai/gemini';
import {
  buildExtractBrandContents,
  EXTRACT_BRAND_SYSTEM,
  type ExtractBrandSource,
} from '../ai/prompts/extract-brand';
import { brandExtractionSchema, brandExtractionJsonSchema } from '../ai/schemas';
import { db } from '../db/client';
import { kbSources, workspaces } from '../db/schema';
import { logger } from '../logger';
import { getStorage } from '../storage';

/** Cap how many sources we include in one extraction call. */
const MAX_SOURCES = 5;

/**
 * Pulls all `ready` KB sources for the workspace, builds a multimodal prompt,
 * runs Gemini, validates the structured output, and writes the brand fields
 * onto `workspaces`. Returns the parsed brand or throws.
 */
export async function extractAndSaveBrand(workspaceId: string) {
  const sources = await db
    .select()
    .from(kbSources)
    .where(eq(kbSources.workspaceId, workspaceId))
    .limit(MAX_SOURCES);

  const ready = sources.filter((s) => s.status === 'ready');
  if (ready.length === 0) {
    throw new Error('No ready knowledge-base sources to analyse');
  }

  const storage = getStorage();
  const promptSources: ExtractBrandSource[] = await Promise.all(
    ready.map(async (s) => {
      let screenshot: ExtractBrandSource['screenshot'];
      if (s.screenshotPath) {
        try {
          const bytes = await storage.get(s.screenshotPath);
          screenshot = { mimeType: 'image/png', bytes };
        } catch (err) {
          logger.warn({ err, key: s.screenshotPath }, 'screenshot missing during brand extract');
        }
      }
      return {
        title: s.title ?? null,
        url: s.url ?? null,
        description:
          (s.metadata as { description?: string } | null)?.description ?? null,
        bodyText: s.contentText ?? '',
        screenshot,
      };
    }),
  );

  const result = await generateContent({
    model: 'gemini-3.1-pro-preview',
    operation: 'extract_brand',
    workspaceId,
    systemInstruction: EXTRACT_BRAND_SYSTEM,
    contents: buildExtractBrandContents(promptSources),
    responseSchema: brandExtractionJsonSchema,
  });

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(result.text);
  } catch {
    throw new Error('Model returned non-JSON output');
  }

  const brand = brandExtractionSchema.parse(parsedJson);

  await db
    .update(workspaces)
    .set({
      brandColors: {
        primary: brand.primaryColor,
        secondary: brand.secondaryColor,
        accent: brand.accentColor,
        background: brand.backgroundColor,
        text: brand.textColor,
      },
      brandFonts: {
        headline: brand.headlineFont,
        body: brand.bodyFont,
      },
      updatedAt: new Date(),
    })
    .where(eq(workspaces.id, workspaceId));

  logger.info(
    {
      workspaceId,
      sources: ready.length,
      tokens: result.inputTokens + result.outputTokens,
      cost: result.costUsd,
    },
    'brand extracted and saved',
  );

  return brand;
}
