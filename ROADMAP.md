# Roadmap

A summary of where Bannerwright is and where it's going. No dates promised — order may shift as we learn from early users.

For the long-form spec, see [PRD.md](PRD.md). For why specific choices were made, see [docs/decisions/](docs/decisions/).

## Now — Private beta (Faza 0–3 done, polish + Faza 4 pending)

The marketing site is live, the waitlist is open, the core stack runs on a single VPS, and the editing workshop is functional end-to-end.

- ✅ Single-user auth (manual sessions, Argon2id)
- ✅ Workspace CRUD
- ✅ Marketing landing at https://bannerwright.com
- ✅ Waitlist signup + admin review at `/account/waitlist`
- ✅ Brand knowledge base: URL → Playwright screenshot + body text scrape, status pending → ready
- ✅ Auto-detect brand (Gemini 3.1 Pro multimodal): pulls colours, fonts, tone from KB sources and writes them onto the workspace
- ✅ Brief → tree-based banner generation (Gemini 3.1 Pro structured output), with retry guard for anemic outputs
- ✅ Tree editor (Webflow-style): Layers panel, Canvas (drag-to-move), Inspector, plus AI chat edit
- ✅ Templates: promote any banner, "Use template" creates a copy with `parent_generation_id`
- ✅ PNG render + download via `/api/generations/[id]/png`

## Next — MVP polish (Faza 4 → Faza 5)

What lands before the public OSS release.

- ✅ Nano Banana background generation inside the tree editor (`canvas.background = image fill`, new version per call)
- ✅ Onboarding hero on empty `/workspaces` (single form for workspace name + optional brand URL, fire-and-forget KB ingestion)
- ✅ GHCR release workflow + `docker-compose.prod.yml` (prebuilt image self-host without cloning)
- Image asset library per workspace (uploads + generated backgrounds in one panel)
- Versions panel + side-by-side diff in the tree editor (legacy editor already has it)
- Tag `v0.1.0` (release pipeline ready; just needs the first push to validate end-to-end)

## Public OSS release (Faza 5)

The moment the repo goes public.

- Repo moved to `bannerwright/bannerwright` on GitHub, MIT licensed
- First tagged release: `v0.1.0`
- Docker images on GHCR (`ghcr.io/bannerwright/bannerwright:v0.1.0` and `:latest`)
- `CONTRIBUTING.md`, `SECURITY.md`, `TRADEMARK.md`
- "Star on GitHub" CTA on the marketing site goes live
- Waitlist remains for "do this for me" hosted asks; self-hosters can clone freely

## After OSS — Managed SaaS (Faza 6+)

Hosted offering for users who don't want to run their own VPS. See [ADR 0005](docs/decisions/0005-licensing-and-release-strategy.md) for the strategy.

- Multi-tenancy work in the core (tenants on top of existing `workspaces`)
- Billing integration (Stripe), usage limits, AI key passthrough
- Hosted onboarding flow (no self-host required)
- "Get hosted" CTA appears next to "Self-host" on the marketing site

## How decisions get made

Anything that changes the data model, the licensing posture, or the user-facing flow lands as an [ADR](docs/decisions/) before it ships. Day-to-day work doesn't need one — just a clean commit and an updated CHANGELOG entry.
