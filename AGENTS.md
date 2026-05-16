# Bannerwright

Self-hostable, open-source AI workshop that turns a brief + brand context into editable HTML banners (PNG export) for social media. **A wright is a maker** — banners are HTML you can read, edit, and own; PNG is just the export.

**Domain:** bannerwright.com · **License:** MIT · **Status:** Faza 0 scaffolded (auth, workspaces CRUD, render skeleton, no AI flows yet)

## Stack

- **Framework:** Next.js 16 (App Router, RSC, Server Actions, Turbopack) + TypeScript strict → `src/app/`
- **Database:** PostgreSQL 16 + pgvector + Drizzle ORM → `src/lib/db/`
- **AI:** Gemini 3.1 Pro + Nano Banana Pro via `@google/genai` → `src/lib/ai/`
- **Rendering:** Playwright singleton (HTML → PNG, URL → screenshot) → `src/lib/renderer/`
- **Auth:** manual sessions (`@oslojs/crypto` + Argon2id), single-user from `.env` → `src/lib/auth/`
- **UI:** Tailwind 4 + shadcn-style primitives (owned in `src/components/ui/`) → `src/components/`

> Stack diverges from PRD on two pinned versions (Next 15 → 16, Lucia v3 → manual sessions). See [ADR 0001](docs/decisions/0001-stack-deviations-from-prd.md).

## Workflow — VPS-only

**No local dev server, no local database.** All work goes straight to the production install at https://bannerwright.com (with https://bannerwright.kawalec.pl kept as a 301 redirect). Local stays as the editor + commits + tests, nothing more.

```bash
pnpm ship "fix: tooltip colour"   # add → commit → push → remote build → curl /api/health
pnpm ship                         # opens $EDITOR for the message
pnpm logs                         # tail production container logs
pnpm deploy:vps                   # remote rebuild only (no commit)
```

Under the hood `pnpm ship` calls `scripts/ship.sh` which `git add -A`, commits, pushes the current branch, SSHes into `kawalec-vps`, runs `/root/stacks/bannerwright/deploy.sh` (git pull → compose build → up → prune), and verifies `/api/health`.

If you really need a local sanity check before shipping:

```bash
pnpm typecheck                  # tsc --noEmit
pnpm lint                       # eslint
pnpm test                       # Vitest unit tests
pnpm test:e2e                   # Playwright E2E
```

Other useful commands:

```bash
pnpm db:generate                # Drizzle: schema → migration (commit + ship)
pnpm db:migrate                 # local-only — VPS migrate runs automatically on ship
pnpm tsx scripts/hash-password.ts <pw>   # generate ADMIN_PASSWORD_HASH
```

## Docs

- [docs/architecture.md](docs/architecture.md) — modules, boundaries, why `lib/renderer` is self-contained
- [docs/database.md](docs/database.md) — schema, conventions, migration rules
- [docs/api.md](docs/api.md) — Server Actions + Route Handlers (SSE streaming)
- [docs/ai-pipeline.md](docs/ai-pipeline.md) — Gemini wrapper, prompts, cost tracking, edit-as-rewrite
- [docs/coding-standards.md](docs/coding-standards.md) — TS, naming, errors, imports
- [docs/deployment.md](docs/deployment.md) — Docker, env vars, self-hosting checklist
- [docs/development-phases.md](docs/development-phases.md) — Faza 0–5 roadmap & deliverables
- [docs/decisions/](docs/decisions/) — ADRs for stack deviations and non-trivial choices
- [PRD.md](PRD.md) — full product spec (source of truth, v1.0)
- [AGENT_INSTRUCTIONS.mdc](AGENT_INSTRUCTIONS.mdc) — Cursor rules (mirrors critical rules below)

## Critical Rules

- **Read [PRD.md](PRD.md) §dotyczącą feature'a + [AGENT_INSTRUCTIONS.mdc](AGENT_INSTRUCTIONS.mdc) §1 before any non-trivial change.**
- **Single-tenant only** — no `tenant_id`, no multi-user code, no OAuth, no registration.
- **Adapters are mandatory:** every Gemini call → `lib/ai/gemini.ts` (logs `llm_usage`); every file op → `lib/storage/`; never import `@google/genai` or `fs` directly from app code.
- **`lib/renderer/` is isolated** — may import only from `lib/storage/`, `lib/db/`, `lib/ai/` (extracted to Fastify in v2).
- **AI editing = full HTML rewrite** (no diff/patch, no tool calls); each edit creates a new `generation_versions` row.
- **No new npm deps, no new AI providers, no background queues (BullMQ/Redis) without explicit user approval.**
