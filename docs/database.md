# Database

PostgreSQL 16 + Drizzle ORM. Schema in `lib/db/schema.ts`. Migrations in `lib/db/migrations/` via `drizzle-kit generate`.

## Extensions

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "vector";   -- pgvector, RAG-ready (unused in MVP)
```

## Tables (full schema in PRD §4)

| Table | Purpose |
|-------|---------|
| `users` | Single admin row; `email`, `password_hash` |
| `sessions` | Lucia sessions |
| `workspaces` | Brand client (`Nike`, `Adidas`); colors, fonts, logo |
| `kb_sources` | KB inputs: URL / upload / text; status, screenshot_path, content_text |
| `kb_embeddings` | pgvector(768) — schema present, unused in MVP |
| `generations` | Banner: `current_html`, `current_png_path`, `format`, `is_template`, `parent_generation_id` |
| `generation_versions` | Snapshot per edit (`triggered_by`: initial / manual_edit / ai_edit / restore) |
| `chat_messages` | Per-generation chat history with AI editor |
| `llm_usage` | Cost tracking per call: model, operation, tokens, cost_usd |

## Conventions

- **UUIDs everywhere** (`gen_random_uuid()`); no serial PKs
- **Timestamps** are `TIMESTAMPTZ` with `DEFAULT NOW()`; mutable rows have `updated_at` + DB trigger
- **Soft deletes:** none — hard deletes with cascading FKs by default
- **JSONB columns** must be Zod-validated before insert; TS type derived via `z.infer<>`
- **Indexes** declared in schema, not as ad-hoc migrations. Postgres does **not** auto-index FKs — add them explicitly
- **`is_template` flag** on `generations` realises the "any generation can be promoted to template" pattern (no separate `templates` table)
- **`parent_generation_id`** tracks origin when a banner is duplicated from a template

## Migrations

```bash
pnpm db:generate     # diff schema.ts → SQL migration file
pnpm db:migrate      # apply pending migrations
pnpm db:studio       # Drizzle Studio (local inspection)
```

Rules:

- Edit `schema.ts` and generate migration in the **same commit**
- **No destructive migrations** (drops, renames of populated tables/columns) without explicit user approval
- Seed only the admin user + one demo workspace; nothing else

## RAG (deferred)

`kb_embeddings` schema is in place; HNSW index, chunking, and retrieval logic are **out of MVP scope**. Activation path: add chunker worker → `CREATE INDEX ON kb_embeddings USING hnsw (embedding vector_cosine_ops)` → wire retrieval into prompt builder. Do not implement until user explicitly enables this milestone.
