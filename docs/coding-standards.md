# Coding Standards

## TypeScript

- `strict: true`. No `any` without an `// eslint-disable-next-line` and a comment explaining why.
- Prefer `type` over `interface`.
- Zod schemas first; derive TS types via `z.infer<>`.
- Validate at every boundary: forms, API inputs, AI structured output, JSONB columns.

## Naming

| Kind | Convention | Example |
|------|-----------|---------|
| Files | `kebab-case.ts` | `render-png.ts` |
| React components | `PascalCase.tsx` | `EditorPanel.tsx` |
| DB tables | `snake_case` plural | `generation_versions` |
| DB columns | `snake_case` (Drizzle maps to camelCase in TS) | `created_at` |
| Server Actions | `camelCase`, verb-first | `createWorkspace`, `restoreVersion` |
| Constants | `SCREAMING_SNAKE_CASE` | `MAX_LLM_COST_USD_PER_DAY` |

## Imports

- Path alias `@/*` for `./src/*` (or root if no `src/`).
- **Never** use deep relative paths (`../../../`).
- Order: external → `@/` aliases → relative.
- **No barrel exports** (`index.ts` re-exporting everything) — they bloat bundles and break tree-shaking.

## Error handling

- **Server Actions** return `{ ok: true, data } | { ok: false, error }`. Never throw to the UI.
- **Route Handlers** return `NextResponse.json({ error })` with proper status codes.
- All AI / Playwright calls wrapped in try/catch with structured `pino` logging.
- User-facing messages are friendly; full error goes to server logs only. Never leak stack traces.

## Comments

- Comment **why**, not **what** — the code shows what.
- TODOs reference an issue or are assigned: `// TODO(dawid): switch to RAG when KB > 500k tokens`.
- Default to no comments. Only add when a hidden constraint, invariant, or non-obvious workaround needs documenting.

## React / Next.js

- Server Components by default. Client Components marked explicitly with `'use client'`.
- Mutations from UI go through Server Actions, not fetch-to-`/api/...`. Route Handlers are reserved for streaming, file I/O, internal services.
- Loading states for every async op: Suspense + skeleton for RSC; `useTransition` for Server Actions.
- Forms: React Hook Form + Zod resolver.

## Style

- Tailwind CSS 4. shadcn/ui primitives owned in `components/ui/`. Do not pull `@radix-ui/*` directly when a shadcn primitive exists.
- No inline `style={{ ... }}` except where Tailwind cannot express it (rare).

## Testing

- **Vitest** for unit tests, co-located as `{file}.test.ts`.
- **Playwright** for E2E in `e2e/`.
- Required (MVP):
  - `lib/ai/gemini.ts` writes to `llm_usage`
  - `lib/renderer/render-png.ts` produces PNG of correct dimensions
  - `lib/storage/local.ts` adapter contract
  - Auth middleware redirects unauthenticated requests
  - One E2E: login → create workspace → generate → see PNG
- **Don't write speculative tests.** Test public APIs, critical flows, and behaviours that have actually broken.

## Don't

- Add npm dependencies without explicit approval.
- Change AI providers / models.
- Add multi-tenancy code, OAuth, registration, password reset.
- Refactor large modules "for cleanliness" outside the current task.
- Skip migration generation when changing `schema.ts`.
- Bypass `lib/storage/`, `lib/ai/`, `lib/renderer/` adapters.
