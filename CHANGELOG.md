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

### Fixed

- `_next/image` failed for `/landing/banners/*` because the auth proxy didn't whitelist them — proxy now allows common static-asset extensions and the `/landing` prefix.

## How to read this file

- `Added` — new features or surfaces.
- `Changed` — adjustments to existing behaviour (non-breaking unless flagged).
- `Deprecated` — soon-to-be-removed features (still functional in the release).
- `Removed` — features deleted in the release.
- `Fixed` — bug fixes.
- `Security` — vulnerability fixes.

Releases get the `[Unreleased]` section renamed to `[vX.Y.Z] — YYYY-MM-DD` when tagged on GitHub.
