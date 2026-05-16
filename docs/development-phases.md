# Development Phases

Six phases, ~7 weeks total to OSS release. Each phase ends with a concrete deliverable a human can verify in a browser.

## Faza 0 — Foundations ✅ done

**Goal:** scaffold runs, you log in, see an empty workspace list.

- [x] Repo: Next.js 16 + TS strict + Tailwind 4 + shadcn-style primitives + Drizzle + ESLint + Prettier
- [x] `docker-compose.yml`: `web` + `db` + `migrate` (Postgres 16 + pgvector, pg_trgm, uuid-ossp)
- [x] Drizzle schema (all tables from PRD §4) + migrations
- [x] Seed: 1 admin user from env, 1 demo workspace
- [x] Manual sessions (Argon2id + `@oslojs/crypto`) + proxy.ts + `/login`
- [x] Layout: sidebar, workspace switcher
- [x] Workspaces CRUD (list, create, edit, delete)
- [x] `lib/storage/` (local FS adapter)
- [x] `lib/ai/gemini.ts` with `llm_usage` logging + retry
- [x] `lib/renderer/playwright.ts` singleton + `renderHtmlToPng()`
- [x] `/api/health`

**Deliverable hit:** prod stack at https://bannerwright.com, login works, healthcheck green, `renderHtmlToPng()` produces PNGs.

## Faza 1 — Knowledge Base ✅ done

**Goal:** add a client URL, see screenshot + extracted brand.

- [x] KB sources CRUD (URL / upload / text)
- [x] Playwright ingestion job (`scrapeUrl` + `processKbUrl`)
- [x] Fire-and-forget pattern with status updates (`pending` → `processing` → `ready` / `failed`)
- [x] UI: KB list, status indicators, screenshot preview, auto-refresh while processing
- [x] "Auto-detect brand" — Gemini 3.1 Pro extracts colours, fonts, tone via structured output
- [x] Brand settings UI (manual override)
- [x] Logo upload

**Deliverable hit:** smoke-tested on stripe.com — ready in ~15s with 11k chars + screenshot, auto-detect filled `#635BFF` purple + `#0A2540` navy + `#00D4FF` cyan + Inter.

## Faza 2 — Generation MVP ✅ done (with retry guard)

**Goal:** brief → generated banner.

- [x] `POST /api/generations` with SSE streaming
- [x] Prompt template `lib/ai/prompts/generate-tree.ts` + structured-output schema
- [x] Full Gemini 3.1 Pro pipeline (multimodal: text + KB screenshots + brand)
- [x] Iframe live preview component (sandboxed)
- [x] Generations list per workspace
- [x] PNG render + download via `/api/generations/[id]/png`
- [x] Generation detail page
- [x] `llm_usage` tracking confirmed (cost-per-call in DB)
- [x] Empty-tree retry guard (`run-tree.ts` retries when Gemini returns 0 text/button nodes)

**Deliverable hit:** brief → 25-45s → tree-based banner with 5-17 nodes, 1080×1080 PNG downloadable.

## Faza 3 — Editor ✅ done (tree-based; some legacy features pending migration)

**Goal:** visual editor with AI chat split-view.

- [x] Tree editor (Webflow-style): Layers panel + Canvas + Inspector + chat
- [x] Drag-to-move shapes on canvas
- [x] Inline text editing (double-click)
- [x] Chat panel UI (multi-turn, streaming via SSE)
- [x] `POST /api/generations/[id]/edit` SSE → new `generation_versions` row
- [x] Snapshot per change (`generation_versions`, `triggered_by` ∈ {initial, ai_edit, visual_edit, restore})
- [x] Monaco code tab (legacy `EditorShell`, surfaced when no `currentTree`)
- [ ] Versions sidebar in `TreeEditorShell` (legacy `EditorShell` has it; tree shell still missing) → Faza 4 polish
- [x] Manual PNG re-render

**Deliverable hit:** edit visually or via chat → live tree updates → new version row per change.

## Faza 4 — Templates + Nano Banana 🟡 partial

**Goal:** promote to template, AI generates backgrounds.

- [x] "Promote to template" + "Use template" flow (with `parent_generation_id`)
- [x] Templates gallery per workspace
- [x] `parent_generation_id` traceability in DB and UI
- [x] Nano Banana Pro integration in `lib/ai/gemini.ts` (`generateImage` → `gemini-3-pro-image-preview`)
- [ ] "Generate background" button on tree banners (currently throws "tree-based image fill lands in Phase 2" — only works on legacy HTML banners)
- [ ] Image asset library per workspace (no UI yet)

**Deliverable:** save banner as template ✅, create new from template ✅, AI background blocked for tree banners ❌.

## Faza 5 — Polish + OSS Release 🟡 partial

**Goal:** internal use stable + GitHub release.

- [x] `lib/ai/gemini.ts` retry on 429/503/timeout
- [x] Retry-on-empty-tree in `run-tree.ts`
- [x] CONTRIBUTING / SECURITY / TRADEMARK / CHANGELOG / ROADMAP on the public surface
- [x] ADRs 0001-0005 for non-trivial decisions
- [x] LICENSE (MIT)
- [x] `.env.example` with comments
- [ ] Onboarding wizard (empty `/workspaces` should funnel new users to first banner)
- [ ] GitHub Actions: lint + typecheck + build on push/PR
- [ ] Prebuilt Docker image on GHCR (`ghcr.io/<owner>/bannerwright:v0.1.0` + `:latest`)
- [ ] Tag `v0.1.0`
- [ ] Repo transfer to `bannerwright/bannerwright`
- [ ] Demo video / screenshots in README
- [ ] Public release

**Deliverable target:** `git clone` + `docker compose up` from a stranger's VPS works — pending GHCR image + README quickstart.

## Out of MVP (v2+)

Multi-format from one HTML, tool-based AI editing, WYSIWYG, RAG embeddings, multi-tenancy + billing, Meta API direct publish, A/B testing, Figma plugin, animated/video output. See PRD §10.
