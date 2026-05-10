# Development Phases

Six phases, ~7 weeks total to OSS release. Each phase ends with a concrete deliverable a human can verify in a browser.

## Faza 0 — Foundations (Week 1)

**Goal:** scaffold runs, you log in, see an empty workspace list.

- [ ] Repo: Next.js 15 + TS strict + Tailwind 4 + shadcn/ui + Drizzle + ESLint + Prettier
- [ ] `docker-compose.yml`: `web` + `db` (Postgres 16 + pgvector, pg_trgm, uuid-ossp)
- [ ] Drizzle schema (all tables from PRD §4) + first migration
- [ ] Seed: 1 admin user from env, 1 demo workspace
- [ ] Lucia Auth + middleware + `/login`
- [ ] Layout: nav, workspace switcher
- [ ] Workspaces CRUD (list, create, edit, delete)
- [ ] `lib/storage/` (local FS adapter)
- [ ] `lib/ai/gemini.ts` skeleton with `llm_usage` logging
- [ ] `lib/renderer/playwright.ts` singleton + simple `renderHtmlToPng()`
- [ ] `/api/health`

**Deliverable:** `docker compose up` → log in → create workspace → manual `renderHtmlToPng()` test produces PNG.

## Faza 1 — Knowledge Base (Week 2)

**Goal:** add a client URL, see screenshot + extracted brand.

- [ ] KB sources CRUD (URL / upload / text)
- [ ] Playwright ingestion job (URL → screenshot + content)
- [ ] Fire-and-forget pattern with status updates in DB
- [ ] UI: KB list, status indicators, screenshot preview
- [ ] "Auto-detect brand" — Gemini 3.1 Pro extracts colours, fonts, tone (structured Zod output)
- [ ] Brand settings UI (manual override)
- [ ] Logo upload

**Deliverable:** paste URL → 10 s later screenshot + auto-filled brand colours.

## Faza 2 — Generation MVP (Week 3–4)

**Goal:** brief → generated banner.

- [ ] `POST /api/generations` with SSE streaming
- [ ] Prompt template `lib/ai/prompts/generate-html.ts` + 3–5 gold examples
- [ ] Full Gemini 3.1 Pro pipeline (multimodal: text + KB screenshots)
- [ ] Iframe live preview component (sandboxed)
- [ ] Generations list per workspace
- [ ] PNG render + download
- [ ] Generation detail page (HTML view + PNG preview)
- [ ] `llm_usage` tracking confirmed

**Deliverable:** brief in → ~30 s later HTML in iframe + downloadable PNG.

## Faza 3 — Editor (Week 5)

**Goal:** Monaco + iframe + AI chat split-view.

- [ ] Monaco Editor (`@monaco-editor/react`) for HTML
- [ ] Live iframe re-render (debounced 500 ms manual; >200 ms last-chunk for streaming)
- [ ] Chat panel UI (messages, input, streaming)
- [ ] `POST /api/generations/[id]/edit` SSE
- [ ] Snapshot per change (`generation_versions`, both manual and AI)
- [ ] Versions sidebar: list, click-to-view, "Restore" creates a NEW version
- [ ] Manual PNG re-render trigger

**Deliverable:** edit HTML manually OR via chat → live preview → versioning works → restore works.

## Faza 4 — Templates + Nano Banana (Week 6)

**Goal:** promote to template, AI generates backgrounds.

- [ ] "Promote to template" + "Use template" flow
- [ ] Templates gallery per workspace
- [ ] `parent_generation_id` traceability
- [ ] Nano Banana Pro integration (function-call from Gemini 3.1 Pro)
- [ ] "Generate background" button in editor
- [ ] Image asset library per workspace

**Deliverable:** save banner as template → create new from template → AI generates a custom background.

## Faza 5 — Polish + OSS Release (Week 7)

**Goal:** internal use stable + GitHub release.

- [ ] Error handling + retry (LLM rate limits, Playwright timeouts)
- [ ] Onboarding wizard (first login → create workspace → add URL → generate first banner)
- [ ] README + self-hosting guide
- [ ] `.env.example` with comments for every var
- [ ] Prebuilt Docker image on GHCR
- [ ] GitHub Actions: lint + typecheck + build
- [ ] LICENSE (MIT)
- [ ] Demo video / screenshots
- [ ] Public release

**Deliverable:** `git clone` + `docker compose up` from a stranger's VPS works.

## Out of MVP (v2+)

Multi-format from one HTML, tool-based AI editing, WYSIWYG, RAG embeddings, multi-tenancy + billing, Meta API direct publish, A/B testing, Figma plugin, animated/video output. See PRD §10.
