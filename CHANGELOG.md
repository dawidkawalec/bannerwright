# Changelog

All notable changes to Bannerwright will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Public marketing landing page at https://bannerwright.com — hero with banner wall, two-flow pipeline section, demo reel, feature pillars, open-source pillar, testimonials marquee, trust metrics, final CTA.
- Brand mark: standalone `[ ▬ ]` glyph (two angle brackets framing a stacked banner pictogram), used in nav, footer, favicon, Apple touch icon, Open Graph + Twitter cards, and app sidebar.
- Dynamic metadata routes via `next/og` — `icon`, `apple-icon`, `opengraph-image`, `twitter-image`.
- SEO: `sitemap.xml`, `robots.txt`, `manifest.webmanifest`, `SoftwareApplication` JSON-LD, expanded keywords, theme-color split for light/dark mode.
- Private-beta waitlist: `waitlist_signups` table, `submitWaitlist` Server Action, `<WaitlistDialog>` on the marketing CTAs, admin view at `/account/waitlist` for status review.

### Changed

- Brand palette unified to a single Uber-green family (HUE 152). All inline hex literals migrated from `#11BB88` (teal HUE 165) to `#06C167`; light-mode primary CSS var aligned with dark mode.
- Production domain cut over to https://bannerwright.com. Legacy `bannerwright.kawalec.pl` kept as a 301 redirect.
- Status reflected in `AGENTS.md` / `ROADMAP.md` / `docs/development-phases.md`: Faza 0-3 marked done end-to-end (auth, KB ingestion, brand auto-detect, tree generation, tree editor, AI chat edit, templates, PNG export). Faza 4-5 partial.

### Fixed

- `_next/image` failed for `/landing/banners/*` because the auth proxy didn't whitelist them — proxy now allows common static-asset extensions and the `/landing` prefix.
- `runTreeGeneration` was occasionally persisting "banners" with `root.children = []` because Gemini 3.1 Pro intermittently returned a minimum-valid empty tree (≈300 output tokens) under the prior "HARD LIMIT 12, NEVER exceed" prompt. The prompt now asks for a positive 5-10 node budget with required headline + supporting element, and the validator counts text/button nodes — if there are none, the existing retry loop fires with explicit feedback. Smoke-tested: 3-attempt retry chain landed a 17-node banner with 4 KB HTML output.

## How to read this file

- `Added` — new features or surfaces.
- `Changed` — adjustments to existing behaviour (non-breaking unless flagged).
- `Deprecated` — soon-to-be-removed features (still functional in the release).
- `Removed` — features deleted in the release.
- `Fixed` — bug fixes.
- `Security` — vulnerability fixes.

Releases get the `[Unreleased]` section renamed to `[vX.Y.Z] — YYYY-MM-DD` when tagged on GitHub.
