# AI Pipeline

All AI calls go through `lib/ai/gemini.ts`. **Never** import `@google/genai` from a Server Action or Route Handler.

## Models (locked)

| Use case | Model ID |
|----------|----------|
| HTML generation, AI editing, brand extraction | `gemini-3.1-pro-preview` |
| Cheap operations (tagging, summarisation) | `gemini-3.1-flash-preview` |
| Custom backgrounds (4K) | `gemini-3-pro-image-preview` (Nano Banana Pro) |
| High-volume images (icons, patterns) | `gemini-3.1-flash-image-preview` (Nano Banana 2) |

Adding any other provider (OpenAI, Anthropic) requires explicit user approval.

## Wrapper contract

```ts
import { generateContent } from '@/lib/ai/gemini';

const result = await generateContent({
  model: 'gemini-3.1-pro-preview',
  operation: 'generate_html',           // logged to llm_usage
  workspaceId,
  generationId,
  contents: [...],                      // multimodal Content[]
  schema?: zodSchema,                   // for structured output
  stream?: true,                        // returns AsyncIterable<chunk>
});
```

The wrapper:

1. Adds the API key from `.env`
2. Streams or buffers based on `stream` flag
3. On completion, **inserts a `llm_usage` row** with model, operation, tokens, cost (from `lib/ai/pricing.ts`)
4. Retries on 429 with exponential backoff; falls back to Flash on hard rate limit
5. Wraps errors with structured `pino` logging

## Prompts

All prompts live in `lib/ai/prompts/{name}.ts`, exported as pure functions returning `Content[]`. **Never inline a long prompt in a handler.**

| File | Purpose |
|------|---------|
| `lib/ai/prompts/generate-html.ts` | Initial banner generation; brand + KB + format constraints |
| `lib/ai/prompts/edit-html.ts` | Full-rewrite edits; current HTML + last 10 chat messages + instruction |
| `lib/ai/prompts/extract-brand.ts` | Auto-detect brand from KB sources (structured Zod output) |
| `lib/ai/prompts/examples/` | 3–5 hand-crafted "gold" HTML examples (few-shot) — mandatory |

### Locked output constraints (generate-html)

The system prompt enforces:

- **Single self-contained HTML document**
- Inline CSS only (or `<style>` in `<head>`)
- Google Fonts via `@import` allowed
- **No `<script>` tags, no external JS**
- Exact viewport dimensions per format (`square_1080`, `story_1080_1920`, `landscape_1200_628`, `portrait_1200_1500`)
- No relative URLs — absolute or data URIs only

## Streaming pattern

Every user-facing AI op streams via SSE. Stream chunks → SSE `partial_html` → debounced iframe re-render in UI (last chunk >200 ms ago, or on completion).

## Editing = full HTML rewrite (MVP)

Do **not** implement diff/patch or tool-calling editing. The AI receives:

1. System prompt: HTML editor persona, "change only what user asks"
2. Last 10 `chat_messages` for context
3. Current HTML
4. User instruction

It returns the **full new HTML**. Each successful edit creates a new `generation_versions` row with `triggered_by='ai_edit'` and `ai_prompt=instruction`.

## Image generation (Nano Banana Pro)

Triggered either by an explicit "Generate background" button or by Gemini 3.1 Pro via function-call during HTML generation. Pipeline:

1. Gemini decides it needs a custom image, calls tool `generate_background({ description, dimensions })`
2. Backend → Nano Banana Pro API → PNG buffer
3. Save via `lib/storage/` to `./storage/workspaces/{wid}/generated/{uuid}.png`
4. Insert URL into HTML (`<img src>` or `background-image`)
5. Continue HTML generation

Track every image gen in `llm_usage` (Nano Banana Pro ~$0.04/image at 4K).

## Cost tracking

Every wrapper call writes to `llm_usage`. Pricing constants live in `lib/ai/pricing.ts`. Update when Google changes prices. Hard caps from env:

- `MAX_GENERATIONS_PER_DAY` — count limit
- `MAX_LLM_COST_USD_PER_DAY` — sum(`cost_usd`) over last 24 h

Approximate per-banner cost at MVP: $0.10 initial + $0.05 × edits + $0.04 per Nano Banana image ≈ **$0.40 for one finished banner with 3 edits + 1 background**.
