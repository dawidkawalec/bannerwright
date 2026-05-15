# ADR 0003 — Marketing landing page at `/` (langchain.com-inspired feeling)

**Date:** 2026-05-15
**Status:** Implemented (Faza 0 polish, pre-MVP)

## Context

The root route `/` was a minimalist hero — Hammer icon, single H1, two CTAs, `Sign in` link. It works as a placeholder but doesn't sell the product, doesn't explain the six MVP features, and doesn't build OSS trust signals. Bannerwright is entering its visible phase: we need a one-pager that converts a curious visitor into a `Start building` click or a `Star on GitHub`.

Reference picked by user: [langchain.com](https://langchain.com) — dark theme, very light display typography (weight 300), letter-by-letter reveal animations on key headlines, sticky pill anchor nav, vertical feature cards, customer-story carousel, count-up trust metrics, final CTA. User's only colour constraint: keep our teal `#11BB88` accent instead of langchain blue.

## Decision

Replace `src/app/page.tsx` with a full one-page LP composed of 12 sections (announcement banner, sticky nav, hero with animated `brief → HTML → PNG` demo, trusted-by logo grid, intro section, sticky anchor pill nav, six-card feature pillars, three-card OSS pillar, testimonials carousel, count-up trust metrics, final CTA, footer). Authenticated users still hit a server-side `redirect('/workspaces')` before any LP renders. Copy is English-only, theme is force-dark.

Ship a Bannerwright brand mark (geometric "B" on teal-gradient rounded square) plus a wordmark, used in nav/footer/OG. Generate favicon, Apple touch icon, OG card, and Twitter card dynamically via `next/og` so they always match the brand and never drift out of sync with a static asset.

## Alternatives considered

- **Keep root minimal, add `/welcome`** — two LPs to maintain, weaker SEO, no clear "front door" for OSS visitors. Rejected.
- **Static PNG OG card** — drifts from brand whenever the logo/colours change; we already render dark-themed React via `next/og` for the LP so reusing JSX is cheaper than a Figma round-trip. Rejected.
- **Mixed dark+light theme per section** — closer to a classical SaaS LP but loses the reference feeling (`langchain.com` is uniformly dark). Rejected.

## Implementation

- **Components:** [src/components/landing/](../../src/components/landing/) — 14 files (sections + `letter-reveal`, `section-wrapper`, `github-icon`). Animations via Framer Motion, all gated by `useReducedMotion`.
- **Brand:** [src/components/brand/logo.tsx](../../src/components/brand/logo.tsx) — single source of truth, `variant: 'mark' | 'wordmark'`.
- **Metadata routes:** [src/app/icon.tsx](../../src/app/icon.tsx) (32×32), [apple-icon.tsx](../../src/app/apple-icon.tsx) (180×180), [opengraph-image.tsx](../../src/app/opengraph-image.tsx) (1200×630), [twitter-image.tsx](../../src/app/twitter-image.tsx) (re-export of OG). All use `ImageResponse` from `next/og`.
- **Auth gate:** [src/proxy.ts](../../src/proxy.ts) extended with `PUBLIC_PATH_PREFIXES` so metadata image routes are reachable to crawlers without a session cookie.
- **Theme:** the LP runs inside the already-dark root layout (`<html class="dark">`), so no per-page theme override was needed. Tokens come from `:root.dark` in [globals.css](../../src/app/globals.css); the `.bw-hero-bg` radial gradient is reused for the hero and final-CTA backgrounds.

## What this ADR is NOT proposing

- **Not** a localisation pipeline — copy is EN-only for now (Polish target audience can read EN; OSS reach is global). A PL variant is cheap to add later if traction requires it.
- **Not** a CMS — copy lives in the React components. Editing requires a PR and a `pnpm ship`. Acceptable while the product is one-person-owned; revisit if the surface grows.
- **Not** a separate marketing site — keeping `/` as the LP avoids a second deployment, second domain, and SEO split between app and marketing.

## Open follow-ups

1. **Real testimonials + logo grid.** Both currently use placeholder personas + brand names (flagged `TODO` in code). Swap before public OSS launch.
2. **GitHub repo URL** is hard-coded as `dawidkawalec/bannerwright` in four places (hero CTA, nav `Star` button, OSS pillar, final CTA, footer). Move to a constant if the repo moves.
3. **Display typography.** Poppins weight 300 carries the langchain feeling but a dedicated display font (e.g. *Instrument Serif*, *Newsreader*) on the headlines would push it further. Considered for a future polish pass.
