import { GoogleGenAI, type Content, type GenerateContentResponse } from '@google/genai';
import { db } from '../db/client';
import { llmUsage, type LlmOperation } from '../db/schema';
import { env } from '../env';
import { logger } from '../logger';
import { computeCostUsd, type ModelId } from './pricing';

let _client: GoogleGenAI | undefined;
function client() {
  return (_client ??= new GoogleGenAI({ apiKey: env.GEMINI_API_KEY }));
}

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1_000;

function isRetryable(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const msg = err.message.toLowerCase();
  return (
    msg.includes('429') ||
    msg.includes('rate') ||
    msg.includes('quota') ||
    msg.includes('503') ||
    msg.includes('overloaded') ||
    msg.includes('500') ||
    msg.includes('etimedout')
  );
}

async function withRetry<T>(label: string, fn: () => Promise<T>): Promise<T> {
  let attempt = 0;
  let lastErr: unknown;
  while (attempt < MAX_RETRIES) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (!isRetryable(err) || attempt === MAX_RETRIES - 1) throw err;
      const delay = BASE_DELAY_MS * Math.pow(2, attempt) + Math.random() * 250;
      logger.warn({ err, label, attempt, delay }, 'gemini retrying');
      await new Promise((r) => setTimeout(r, delay));
      attempt++;
    }
  }
  throw lastErr;
}

function buildConfig(input: GenerateInput) {
  const config: Record<string, unknown> = {};
  if (input.systemInstruction) config.systemInstruction = input.systemInstruction;
  if (input.responseSchema) {
    config.responseMimeType = 'application/json';
    config.responseSchema = input.responseSchema;
  }
  return config;
}

export type GenerateInput = {
  model: ModelId;
  operation: LlmOperation;
  workspaceId?: string;
  generationId?: string;
  contents: Content[];
  /** JSON Schema (Gemini structured output). */
  responseSchema?: unknown;
  systemInstruction?: string;
};

export type GenerateResult = {
  text: string;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  raw: GenerateContentResponse;
};

/**
 * Single-shot generation. Logs usage to `llm_usage` after the call.
 * For streaming, use {@link generateContentStream}.
 */
export async function generateContent(input: GenerateInput): Promise<GenerateResult> {
  const started = Date.now();
  try {
    const response = await withRetry('generateContent', () =>
      client().models.generateContent({
        model: input.model,
        contents: input.contents,
        config: buildConfig(input),
      }),
    );

    const inputTokens = response.usageMetadata?.promptTokenCount ?? 0;
    const outputTokens = response.usageMetadata?.candidatesTokenCount ?? 0;
    const costUsd = computeCostUsd(input.model, inputTokens, outputTokens);

    await logUsage({ ...input, inputTokens, outputTokens, costUsd });

    logger.debug(
      { model: input.model, operation: input.operation, inputTokens, outputTokens, costUsd, ms: Date.now() - started },
      'gemini.generateContent',
    );

    return { text: response.text ?? '', inputTokens, outputTokens, costUsd, raw: response };
  } catch (err) {
    logger.error({ err, model: input.model, operation: input.operation }, 'gemini.generateContent failed');
    throw err;
  }
}

/**
 * Streaming generation. Yields text chunks. Logs usage after the stream completes.
 */
export async function* generateContentStream(
  input: GenerateInput,
): AsyncGenerator<string, GenerateResult, void> {
  const started = Date.now();
  try {
    const stream = await withRetry('generateContentStream', () =>
      client().models.generateContentStream({
        model: input.model,
        contents: input.contents,
        config: buildConfig(input),
      }),
    );

    let full = '';
    let last: GenerateContentResponse | undefined;
    for await (const chunk of stream) {
      last = chunk;
      const piece = chunk.text ?? '';
      if (piece) {
        full += piece;
        yield piece;
      }
    }

    const inputTokens = last?.usageMetadata?.promptTokenCount ?? 0;
    const outputTokens = last?.usageMetadata?.candidatesTokenCount ?? 0;
    const costUsd = computeCostUsd(input.model, inputTokens, outputTokens);

    await logUsage({ ...input, inputTokens, outputTokens, costUsd });

    logger.debug(
      { model: input.model, operation: input.operation, inputTokens, outputTokens, costUsd, ms: Date.now() - started },
      'gemini.generateContentStream',
    );

    return {
      text: full,
      inputTokens,
      outputTokens,
      costUsd,
      raw: last as GenerateContentResponse,
    };
  } catch (err) {
    logger.error({ err, model: input.model, operation: input.operation }, 'gemini.generateContentStream failed');
    throw err;
  }
}

async function logUsage(args: {
  model: ModelId;
  operation: LlmOperation;
  workspaceId?: string;
  generationId?: string;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
}) {
  try {
    await db.insert(llmUsage).values({
      model: args.model,
      operation: args.operation,
      workspaceId: args.workspaceId,
      generationId: args.generationId,
      inputTokens: args.inputTokens,
      outputTokens: args.outputTokens,
      costUsd: args.costUsd.toString(),
    });
  } catch (err) {
    // Never let usage logging break the user-facing call.
    logger.error({ err }, 'failed to insert llm_usage row');
  }
}

export type GenerateImageInput = {
  model: Extract<
    ModelId,
    'gemini-3-pro-image-preview' | 'gemini-3.1-flash-image-preview'
  >;
  operation: LlmOperation;
  workspaceId?: string;
  generationId?: string;
  /** Free-form description of the image to generate. */
  prompt: string;
  /**
   * Optional reference images for multimodal grounding (logo, KB screenshots,
   * mood-board). Must be pre-cropped to the target aspect ratio — Nano Banana
   * inherits the output aspect from the supplied references, not from the
   * prompt's dimension text. Use `prepareReferences` from `lib/renderer/`.
   */
  referenceImages?: Array<{ mimeType: string; bytes: Buffer }>;
};

export type GenerateImageResult = {
  bytes: Buffer;
  mimeType: string;
  costUsd: number;
};

/**
 * Generate a single image via Nano Banana (Gemini 3 Pro Image Preview).
 * The SDK returns inline image bytes inside the `candidates[0].content.parts`
 * structure; we extract the first inlineData part.
 */
export async function generateImage(input: GenerateImageInput): Promise<GenerateImageResult> {
  const started = Date.now();
  try {
    const parts: NonNullable<Content['parts']> = [{ text: input.prompt }];
    for (const ref of input.referenceImages ?? []) {
      parts.push({
        inlineData: {
          mimeType: ref.mimeType,
          data: ref.bytes.toString('base64'),
        },
      });
    }
    const response = await withRetry('generateImage', () =>
      client().models.generateContent({
        model: input.model,
        contents: [{ role: 'user', parts }],
      }),
    );

    const part = response.candidates
      ?.flatMap((c) => c.content?.parts ?? [])
      .find((p) => p.inlineData?.data);

    if (!part?.inlineData?.data) {
      throw new Error('Image model returned no inline data');
    }

    const bytes = Buffer.from(part.inlineData.data, 'base64');
    const mimeType = part.inlineData.mimeType ?? 'image/png';
    const costUsd = computeCostUsd(input.model, 0, 0, 1);

    await logUsage({
      model: input.model,
      operation: input.operation,
      workspaceId: input.workspaceId,
      generationId: input.generationId,
      inputTokens: 0,
      outputTokens: 0,
      costUsd,
    });

    logger.debug(
      { model: input.model, operation: input.operation, bytes: bytes.length, costUsd, ms: Date.now() - started },
      'gemini.generateImage',
    );

    return { bytes, mimeType, costUsd };
  } catch (err) {
    logger.error({ err, model: input.model, operation: input.operation }, 'gemini.generateImage failed');
    throw err;
  }
}
