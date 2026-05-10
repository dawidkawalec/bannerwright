# ADR 0002 — Visual (WYSIWYG) editor mode for non-technical users

**Date:** 2026-05-10
**Status:** Proposed (planning only — no implementation)
**Phase target:** Faza 6 (post-MVP)

## Context

Bannerwright's current editor (Faza 3) is split into Monaco (HTML code) + iframe preview + AI chat. It works well for users comfortable with HTML — Dawid's words: "mnie HTML nie przeraża, ale osoby nietechniczne przeraża by bardzo".

The PRD §3 explicitly classified WYSIWYG as out-of-MVP because of effort estimate ("WYSIWYG = 2 miesiące pracy"). Current decision: revisit that, plan a path to WYSIWYG that fits Bannerwright's "HTML is the source of truth" principle without abandoning power users.

## Goal

A non-technical user lands on a generated banner and can:

1. **Click any visible element** (headline, paragraph, CTA, image) → element gets a selection outline.
2. **Edit text inline** — type directly into the element.
3. **Open a small floating toolbar** with: text colour, font size, font family (Google Fonts whitelist), padding/margin, background fill.
4. **Drag** to reposition (stretch goal — likely Faza 7).
5. **Save** — every committed visual change creates a `generation_versions` row, just like manual / AI edits do today.

Power users can still toggle to **Code** (Monaco) or **Chat** (AI rewrite). All three modes round-trip the same HTML.

## Three approaches considered

### A. Iframe + injected bridge script *(rejected)*

Iframe with `sandbox="allow-same-origin allow-scripts"` and a small bridge script we inject into the document. The bridge listens for clicks, sends element selectors to the parent via `postMessage`, parent renders the toolbar.

**Why rejected:** loosening the sandbox to allow scripts means AI-generated HTML can also run scripts, even after DOMPurify (DOMPurify config gets fragile fast — every `on*` attribute, every `javascript:` URL, every CSS expression). Self-hosted users running this against arbitrary client URLs in the future increases the blast radius. Not worth the security tax.

### B. Shadow DOM rendering *(recommended)*

Render the banner HTML into a Shadow DOM root inside the editor page. The Shadow DOM gives us:

- CSS isolation (banner styles don't leak into app UI, and vice versa).
- Full DOM access from the parent (no postMessage handshake — we can attach event listeners and inspect/mutate elements directly).
- No JavaScript execution from the inserted HTML — Shadow DOM doesn't auto-execute `<script>` even if present, and DOMPurify already strips them.

Trade-off: external resources (`@import url(google fonts)`) work; data URIs work; relative URLs don't (already a constraint in our prompt).

**This is the recommended path.**

### C. Server-side AST pipeline *(too heavy for the size of edits)*

Parse HTML to an AST (e.g. `parse5` or `htmlparser2`), serve the AST as a structured tree to the client, render React components from the AST, and serialise back on save. This is the "Webflow" model.

**Why rejected for now:** rebuilds the rendering pipeline (we'd no longer just show the HTML — we'd interpret it), couples the UI to the AST shape, and forces every styling change to round-trip a structured edit. Heavy. Reconsider if we ever build a multi-format / responsive layout (PRD §10 v2+).

## Recommended architecture (Approach B)

```
┌────────────────────────────────────────────────────────────────┐
│  components/editor/visual/                                     │
│  ┌──────────────────────┐  ┌─────────────────────────────────┐ │
│  │ VisualCanvas         │  │ FloatingToolbar                 │ │
│  │ ─ shadow-root host   │  │ ─ position: absolute            │ │
│  │ ─ scaled to fit      │  │ ─ shows for selected element    │ │
│  │ ─ click → select     │  │ ─ text/colour/font/spacing      │ │
│  └──────────────────────┘  └─────────────────────────────────┘ │
│           │                          │                         │
│           └──────────┬───────────────┘                         │
│                      ▼                                         │
│           lib/editor/visual-ops.ts                             │
│           ─ getSelectorPath(element)                           │
│           ─ patchHtml(html, selector, ops)                     │
│           ─ commit(html) → save Server Action                  │
└────────────────────────────────────────────────────────────────┘
```

### Selector strategy

Each editable element gets stamped with a `data-bw-id` attribute on first render (deterministic from its position in the tree, e.g. `e_h1_0`, `e_p_0`, `e_div_0_a_1`). Edits target `data-bw-id`, not arbitrary CSS selectors — survives small DOM rearrangements better than indexes.

Stamping happens once during a "prepare for visual mode" pass: walk the DOM, assign IDs, serialise back to HTML. Saved as a new version with `triggered_by='visual_prepare'`. After that, the HTML carries stable IDs forever.

### Edit operations

Three primitives, all reversible:

1. `setText(selector, newText)` — `element.textContent = newText`.
2. `setStyle(selector, prop, value)` — appends a scoped rule to the `<style>` block: `[data-bw-id="e_h1_0"] { color: #ff0000 }`. Existing rule is replaced if present.
3. `setAttribute(selector, attr, value)` — for `<img src>`, `<a href>` (only if we ship anchors).

The toolbar ONLY produces these primitive ops. The parent component composes them into a single batched edit on save.

### Save flow

- Live edits update an in-memory copy of the HTML.
- "Save" button calls a new Server Action `saveVisualEdit(generationId, html)` that mirrors `saveManualEdit`:
  - Inserts a `generation_versions` row with `triggered_by='visual_edit'`.
  - Re-renders PNG.
  - Returns `{ versionNumber, versionId }`.

### Mode toggle

The editor page gets a tab strip:

```
[ Visual ]  [ Code ]  [ Chat ]
```

Default: **Visual** (for non-technical users). Power users can switch to Code (current Monaco) or Chat (current AI rewrite). All three operate on the same `currentHtml` and produce the same kind of versioning.

Switching modes is free — they all read from the same state. Switching FROM Code TO Visual triggers a "prepare" pass to re-stamp `data-bw-id`s if the user removed them.

## Schema implications

Schema additions to `generation_versions.triggered_by`:

```diff
-CHECK (triggered_by IN ('initial_generation', 'manual_edit', 'ai_edit', 'restore'))
+CHECK (triggered_by IN ('initial_generation', 'manual_edit', 'ai_edit', 'restore',
+                         'visual_edit', 'visual_prepare'))
```

No new tables. No new columns. Migration is a CHECK constraint update + Drizzle enum update.

## Effort estimate

Realistic mid-estimate for a working v1 (text + colours + fonts only, no drag, no image swap):

| Slice | Effort |
|-------|--------|
| Shadow DOM canvas + scale-to-fit + selection outlines | 1.5 d |
| `data-bw-id` stamping + selector helpers + tests | 1 d |
| Floating toolbar UI (text/colour/font/spacing fields) | 2 d |
| Edit ops + HTML patcher + tests | 2 d |
| Mode toggle + state coordination with Code/Chat | 1 d |
| Server Action + version trigger + migration | 0.5 d |
| Polish (keyboard nav, escape to deselect, undo) | 1.5 d |
| **Total** | **~9.5 d** (≈ 2 weeks part-time) |

This is much less than the PRD's "2 months" estimate — because:

- We don't need to re-implement layout primitives. The HTML *is* the layout.
- We don't need a custom rendering engine. Shadow DOM + Tailwind-free generated CSS does the job.
- We constrain edits to a tight whitelist of CSS properties.

## What this ADR is NOT proposing

- **Not** a layout drag-and-drop tool (Figma-style). Banners are 1080×1080 fixed canvases; rearranging boxes is rare. Maybe Faza 7.
- **Not** undo/redo beyond version restore. Existing version history is the undo.
- **Not** visual editing of AI-generated images (Nano Banana). Images stay swappable via "regenerate with different prompt" flow.
- **Not** WYSIWYG for the brand settings page. That's already a normal form.

## Open questions

1. **Inline contentEditable vs popover input?** Inline is more direct (Webflow-style). Popover is more predictable (avoids accidental edits during selection). I lean inline + click-outside-to-commit.
2. **Font family picker**: full Google Fonts list (~1700 entries) or curated subset (~30)? Curated is friendlier for non-technical users; we can always allow "type custom" as escape hatch.
3. **Selection visual**: dashed outline like Figma, or filled overlay? Probably outline — keeps the banner visible during edits.
4. **Mobile**: punt to v2. The editor is desktop-only.

## Recommendation

Schedule this as **Faza 6** after the current Polish + OSS release (Faza 5). Approach B (Shadow DOM) is the technical bet. ~9.5 dev-days realistic.

Until then, the existing Monaco + Chat editor stays as-is for power users. AI chat ("zmień tło na niebieskie") is the closest non-technical path today — it works, but lacks the immediacy of clicking on the headline and typing.
