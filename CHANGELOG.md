# Changelog

All notable changes to Bannerwright will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **Image-first generation pipeline (Nano Banana → Vision encode).** Replaces the old "auto background + text overlay" flow that produced flat, generic banners. New flow: Nano Banana receives the full creative brief + brand palette + style preset and renders the COMPLETE banner (visual + text + composition) as a 1080×1080 PNG. That PNG is then passed to Gemini 3 Pro with a new `ENCODE_DESIGN_SYSTEM` instruction that vision-transcribes it into an editable BannerTree — every visible text block becomes a real text node, every shape becomes a shape node, the canvas background is recreated as a linear gradient or solid colour (Mode A pure reconstruction, no burned-in image so editing text stays clean). Reference PNG is persisted to `/assets`. New `buildDesignPrompt` helper and `lib/ai/prompts/encode-design.ts`. Style presets gained a `designPrompt` field (full-design spec) alongside the legacy `bgPrompt`. The Auto preset is now an explicit text-only fast path (~25 s, ~$0.02); other presets default to image-first (~45 s, ~$0.06). `runTreeGeneration` branches on `preset.id === 'auto' || withBackground === false`; both branches feed the same retry-on-empty validator. Progress labels updated: "Painting design with Nano Banana…" → "Encoding design as editable tree…" → "Rendering PNG…".
- **Brand preview swatches** in `/generations/new` — 5-circle palette + headline/body font names render between the inspiration dropzone and the Generate button so the user can sanity-check the AI context. Falls back to "auto-detect from Settings" when no brand set.
- **"New variant" shortcut** on the generation page — header button next to Promote/Delete jumps to `/generations/new?brief=...&title=Variant of ...` with the brief pre-filled. Form reads `?brief` / `?title` search params at mount and seeds state.
- **Brand logo flows into generated banners.** `workspace.logoUrl` is loaded from storage and passed as a multimodal image part with placement hints ("top-left/center, 80–160px, never recreate from shapes"). Model emits an image node with `src="__BW_LOGO__"`; server walks the tree post-validation and swaps the placeholder for the real data URI so the rendered PNG embeds the logo without network access.
- **Tree-aware version restore + versions panel in the tree editor.** `<VersionsPanel>` (previously legacy-only) now sits below the chat in `<TreeEditorShell>`. `restoreVersion` Server Action branches on tree vs html — for tree versions it inserts a fresh row with both tree+html, calls `updateGenerationCurrentTree`, and re-renders the PNG from the tree. Legacy HTML path retained for the two pre-tree banners.
- **Image asset library** at `/workspaces/[id]/assets` — thumbnail grid of every Nano Banana background (and future generated images) per workspace, with size/date metadata, copy-filename and delete actions. New `LocalStorage.list()` method, `listGeneratedAssets`/`deleteGeneratedAsset` Server Actions, and `GET /api/workspaces/[id]/assets/[name]` route. Sidebar nav gains an "Assets" entry between Templates and Settings.
- **Mobile-responsive tree editor.** Below `md` (768px) the Layers and Inspector panels collapse into `<Sheet>` drawers triggered from toolbar icons, and the chat + versions sidebar stacks below the canvas. Tested 375px iPhone-class up to 1440px desktop. Desktop layout unchanged.
- **Nano Banana background generation on tree banners.** `generateBannerBackground` now branches on `currentTree` vs `currentHtml`. The tree path sets `canvas.background = { kind: 'image', src: dataUri, fit: 'cover' }`, re-renders the HTML cache via `renderTreeToHtml`, persists a new `generation_versions` row, and refreshes `currentTree` / `currentHtml` / `currentPngPath` together. The legacy `body[data-bw-bg]` injection path is retained for pre-tree banners. `<BackgroundButton>` now sits in the `<TreeEditorShell>` sidebar above the chat; the page re-keys the shell on `generation.updatedAt` so the new background flows into local state.
- **Onboarding hero on empty `/workspaces`.** When a freshly authenticated user has 0 workspaces, `/workspaces` swaps the dashboard for `<OnboardingHero>` — a single combined form (workspace name + optional brand URL) wired to the new `onboardWorkspace` Server Action. The action validates inputs, creates the workspace, fires `processKbUrl` in the background, and redirects straight to `/workspaces/{id}` so the user lands on a populated state with KB processing visible.
- **GHCR release workflow.** `.github/workflows/release.yml` triggers on `v*.*.*` tags, builds the Docker image once, and pushes `ghcr.io/dawidkawalec/bannerwright:v<semver>` + `:latest`. New `docker-compose.prod.yml` pulls that image so OSS self-hosters can `docker compose up` without cloning the repo. README quickstart points at both flows (prebuilt image and clone-and-build).
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

- **`<TreeCanvas>` no longer renders as a 1px-wide strip on first paint.** Switched from `useEffect` to `useLayoutEffect` for the initial measurement, starting at scale 0 so the canvas is invisible during the brief measurement window. Synchronous getBoundingClientRect inside the layout effect computes the real scale before the browser paints, then ResizeObserver takes over for live resizes. Tightened side-panel widths (Layers 220→180, Inspector 280→220) so the canvas actually has room on 1280–1440px laptops.
- **Hydration warning on asset card dates** — `toLocaleString()` differs between SSR locale and the client's timezone; moved the date render into `useEffect` so server emits an empty placeholder and the client fills it in.
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
