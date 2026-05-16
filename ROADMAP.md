# Roadmap

A summary of where Bannerwright is and where it's going. No dates promised — order may shift as we learn from early users.

For the long-form spec, see [PRD.md](PRD.md). For why specific choices were made, see [docs/decisions/](docs/decisions/).

## Now — Private beta (Faza 0–1)

The marketing site is live, the waitlist is open, the core stack runs on a single VPS.

- ✅ Single-user auth (manual sessions, Argon2id)
- ✅ Workspace CRUD
- ✅ Marketing landing at https://bannerwright.com
- ✅ Waitlist signup + admin review at `/account/waitlist`
- 🟡 Brand knowledge base (URL screenshot + colour/font/voice extraction) — in progress

## Next — MVP (Faza 2–4)

What lands before the public OSS release.

- HTML generation from a brief + brand profile (Gemini 3.1 Pro, streamed)
- Editor split-view: Monaco code · iframe preview · AI chat
- Multi-turn chat editor (full HTML rewrite per turn, version per edit)
- Reusable templates with `parent_generation` lineage
- On-demand AI imagery (Nano Banana) embedded straight into the HTML
- Version history with side-by-side diff and one-click restore

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
