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
    const response = await client().models.generateContent({
      model: input.model,
      contents: input.contents,
      config: buildConfig(input),
    });

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
    const stream = await client().models.generateContentStream({
      model: input.model,
      contents: input.contents,
      config: buildConfig(input),
    });

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
