# Architecture

Bannerwright is a Next.js 15 monolith. App, API, and rendering all run in one process; modules with future-extraction value (`lib/renderer/`) are isolated behind clean boundaries.

## High-level diagram

```
Browser ──HTTPS──▶ Next.js (RSC + Server Actions + Route Handlers)
                       │
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼
   Postgres 16    Local FS       Gemini APIs
   + pgvector    ./storage/      Gemini 3.1 Pro
                                 Nano Banana Pro
```

Single process, single Dockerfile. Playwright (chromium) runs in-process; image ~1.5 GB but accepted for self-host simplicity.

## Module map

| Module | Responsibility | May import from |
|--------|---------------|-----------------|
| `app/` | Pages, layouts, Server Actions, Route Handlers | `components/`, `lib/*` |
| `components/` | UI (shadcn primitives, domain components, editor) | `lib/utils`, `lib/schemas` |
| `lib/db/` | Drizzle schema, client, queries, migrations | (leaf) |
| `lib/storage/` | File adapter (`local.ts` for MVP, `s3.ts` later) | (leaf) |
| `lib/ai/` | Gemini SDK wrapper, prompts, structured-output schemas, `llm_usage` logging | `lib/db/`, `lib/storage/` |
| `lib/renderer/` | Playwright singleton, HTML→PNG, URL→screenshot | `lib/storage/`, `lib/db/`, `lib/ai/` |
| `lib/auth/` | Lucia config, session middleware | `lib/db/` |
| `lib/schemas/` | Zod input schemas (forms, API) | (leaf) |
| `lib/utils/` | Pure helpers, no I/O | (leaf) |

**`lib/renderer/` rule** — extracted to a Fastify service in v2, so it must not import from `app/` or `components/`. Enforce via lint or review.

**`lib/storage/` rule** — every file op flows through it. Never call `fs.*` or hardcode `./storage/...` in app code. SaaS swaps to S3 by replacing `local.ts`.

**`lib/ai/` rule** — every Gemini call goes through `lib/ai/gemini.ts` so cost tracking via `llm_usage` is automatic and centralized.

## Data flow: end-to-end "generate"

1. UI submits brief → Server Action validates with Zod → calls Route Handler `POST /api/generations` (SSE)
2. Handler builds prompt via `lib/ai/prompts/generate-html.ts` (brand + KB + screenshots + brief)
3. `lib/ai/gemini.ts` streams Gemini 3.1 Pro response; chunks pushed as SSE `partial_html`
4. On completion: insert `generations` row + `generation_versions` v1 + `chat_messages`
5. `lib/renderer/render-png.ts` opens context in singleton browser, sets viewport per format, screenshots, saves via `lib/storage/`
6. SSE `done` event with `pngUrl`

## Concurrency & limits

- Single Playwright browser instance, **max 3 contexts** in parallel (queue beyond)
- Auto-restart browser every ~100 renders or on crash
- Hard daily caps: `MAX_GENERATIONS_PER_DAY`, `MAX_LLM_COST_USD_PER_DAY` (env)
- No queue (BullMQ/Redis) in MVP — single user, low concurrency

## What we deliberately don't build

Multi-tenancy, OAuth, billing, mobile UI, RAG retrieval (schema only), tool-calling AI edits, WYSIWYG editor, direct social-platform publish. See PRD §10.
