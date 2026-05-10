# Bannerwright

Self-hostable, open-source AI workshop that turns a brief + brand context into editable HTML banners (PNG export) for social media. **A wright is a maker** — banners are HTML you can read, edit, and own; PNG is just the export.

**Domain:** bannerwright.com · **License:** MIT · **Status:** pre-scaffold (PRD + agent rules only)

## Stack

- **Framework:** Next.js 15 (App Router, RSC, Server Actions) + TypeScript strict → `app/`
- **Database:** PostgreSQL 16 + pgvector + Drizzle ORM → `lib/db/`
- **AI:** Gemini 3.1 Pro + Nano Banana Pro via `@google/genai` → `lib/ai/`
- **Rendering:** Playwright singleton (HTML → PNG, URL → screenshot) → `lib/renderer/`
- **Auth:** Lucia v3, single-user from `.env` → `lib/auth/`
- **UI:** Tailwind 4 + shadcn/ui + Monaco Editor → `components/`

## Commands

```bash
# Project not yet scaffolded — Faza 0 sets up:
docker compose up           # web + db (Postgres + pgvector)
pnpm dev                    # Next.js dev server
pnpm db:generate            # Drizzle: schema → migration
pnpm db:migrate             # apply migrations
pnpm test                   # Vitest unit tests
pnpm e2e                    # Playwright E2E
```

## Docs

- [docs/architecture.md](docs/architecture.md) — modules, boundaries, why `lib/renderer` is self-contained
- [docs/database.md](docs/database.md) — schema, conventions, migration rules
- [docs/api.md](docs/api.md) — Server Actions + Route Handlers (SSE streaming)
- [docs/ai-pipeline.md](docs/ai-pipeline.md) — Gemini wrapper, prompts, cost tracking, edit-as-rewrite
- [docs/coding-standards.md](docs/coding-standards.md) — TS, naming, errors, imports
- [docs/deployment.md](docs/deployment.md) — Docker, env vars, self-hosting checklist
- [docs/development-phases.md](docs/development-phases.md) — Faza 0–5 roadmap & deliverables
- [PRD.md](PRD.md) — full product spec (source of truth)
- [AGENT_INSTRUCTIONS.mdc](AGENT_INSTRUCTIONS.mdc) — Cursor rules (mirrors critical rules below)

## Critical Rules

- **Read [PRD.md](PRD.md) §dotyczącą feature'a + [AGENT_INSTRUCTIONS.mdc](AGENT_INSTRUCTIONS.mdc) §1 before any non-trivial change.**
- **Single-tenant only** — no `tenant_id`, no multi-user code, no OAuth, no registration.
- **Adapters are mandatory:** every Gemini call → `lib/ai/gemini.ts` (logs `llm_usage`); every file op → `lib/storage/`; never import `@google/genai` or `fs` directly from app code.
- **`lib/renderer/` is isolated** — may import only from `lib/storage/`, `lib/db/`, `lib/ai/` (extracted to Fastify in v2).
- **AI editing = full HTML rewrite** (no diff/patch, no tool calls); each edit creates a new `generation_versions` row.
- **No new npm deps, no new AI providers, no background queues (BullMQ/Redis) without explicit user approval.**
