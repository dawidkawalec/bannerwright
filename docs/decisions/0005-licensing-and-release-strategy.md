# ADR 0005 — Licensing, distribution, and release cadence

**Date:** 2026-05-16
**Status:** Proposed (not implemented — strategic plan for the OSS launch + future SaaS)

## Context

Bannerwright will exist in two shapes at maturity:

1. **Self-hosted (open source).** What the codebase already is — a single Docker stack, MIT licensed, anyone with a VPS can run it. This is the public launch product.
2. **Managed (SaaS).** A future commercial offering — same code, hosted by us, multi-tenant, billed per usage. Not built yet; the codebase has hooks in place (`workspaces` table, `llm_usage` cost tracking) so when we get there we don't have to rewrite the world.

We need a licensing and distribution model that supports both without painting us into a corner.

## Decision (proposed)

### Licensing

- **Open-source code: stays MIT.** It's already what the repo declares. MIT keeps the OSS option meaningful (forks, audits, contributions) and matches the "yours by design" pitch on the marketing site.
- **Managed-SaaS code, when it exists: lives in a separate repo or private path.** Anything specific to the hosted offering (billing, tenant isolation, abuse limits, ops scripts) is **not** part of the MIT codebase. This protects the commercial offering without hurting self-hosters.
- **Trademark.** "Bannerwright" the word, the logo mark (`[ ▬ ]`) and the marketing site copy are **not** under MIT. Add a `TRADEMARK.md` clarifying that fork = fine, "use the Bannerwright name on a competing service" = not fine. Reference how Plausible / PostHog handle this.
- **No license changes mid-life.** No BSL, no Elastic License, no SSPL relicense moves. We pick MIT and live with it — the SaaS edge comes from running it well, not from license restrictions.

### Distribution

- **Open source instance — `bannerwright/bannerwright` on GitHub.** Public. Issue tracker = bug reports + feature requests. Discussions = "show me your setup" / Q&A.
- **Releases via GitHub tags + Docker images.** `v0.1.0`, `v0.2.0`, etc. (semver). Build container image on tag push → `ghcr.io/bannerwright/bannerwright:v0.2.0` and `:latest`. Self-hosters pin to a major version.
- **SaaS — `bannerwright.com/app` (future).** Same codebase, separate stack. Free trial + paid tiers. The marketing site (`bannerwright.com`) already serves the front door; "Get hosted" CTA appears next to "Self-host" when SaaS is live.

### Release cadence

- **Semver, conservatively.** `0.x` for the pre-1.0 period (we're at `0.1.0`). Breaking schema or env changes bump minor; bug fixes bump patch.
- **Tag = release.** GitHub Releases auto-pulls from a section of `CHANGELOG.md` keyed by version. No dedicated release notes file.
- **Cadence target.** When the queue justifies it, not on a schedule. Aim for releases every 2–4 weeks during active development.

### Changelog

[CHANGELOG.md](../../CHANGELOG.md) at repo root. Follows the [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) convention:

```
## [Unreleased]
### Added
- New thing.
### Changed
- Tweaked thing.
### Fixed
- Bug.
```

Maintained by hand on each PR that warrants user-facing notes. On release, the `[Unreleased]` section is renamed `[v0.X.Y] — YYYY-MM-DD`.

### Roadmap

[ROADMAP.md](../../ROADMAP.md) at repo root, mapped against the PRD's Faza 0–5 plan. Public-facing summary of what's coming next, no dates promised. Linked from the marketing site footer once it exists.

## Phase plan

| Phase             | Status         | What changes                                                                                                            |
|-------------------|----------------|-------------------------------------------------------------------------------------------------------------------------|
| **Private beta**  | now            | Closed waitlist via [ADR 0004](0004-waitlist-and-access-flow.md). Admin hand-walks people through self-host.            |
| **Public OSS**    | next milestone | Push `bannerwright/bannerwright` public, MIT, first tagged release `v0.1.0`. Marketing site links the repo, no waitlist. |
| **Managed SaaS**  | post-MVP       | Multi-tenancy work, billing, hosted onboarding. Marketing site adds a "Get hosted" CTA alongside "Self-host".            |

## Alternatives considered

- **AGPL** instead of MIT to discourage "host-and-resell" copycats. Rejected — Bannerwright's moat isn't the code, it's brand extraction quality + AI key economics. AGPL would scare off small agencies (the target audience) more than it would deter competitors.
- **BSL with future MIT conversion** (the Sentry / HashiCorp playbook). Rejected — premature, the project is too small for a license that needs lawyers to read.
- **SSPL / proprietary core + free community.** Rejected — undermines the "open by default" pitch that's on the marketing site.

## Open follow-ups

1. **Decide GitHub org name.** Currently the repo URL is `dawidkawalec/bannerwright` (personal). Should likely move to `bannerwright` org before public push.
2. **Trademark filing.** Worth at least a `TRADEMARK.md` and a low-stakes USPTO/EU filing once revenue justifies it.
3. **CONTRIBUTING.md.** Light first version: "open an issue first for anything non-trivial; PRs welcome for clearly scoped bug fixes."
4. **Security disclosure.** `SECURITY.md` with `security@bannerwright.com` (or `hello@kawalec.pl` initially) and a 7-day acknowledge SLA.

## What this ADR is NOT proposing

- **Not** building the SaaS edition yet — Phase 3 work, blocked on multi-tenancy.
- **Not** changing the MIT license. The license is final unless a future, well-justified ADR overrides this one.
- **Not** automating release notes via release-please / changesets — manual `CHANGELOG.md` until the volume justifies tooling.
