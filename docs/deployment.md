# Deployment & Self-Hosting

The project is self-host-first. Every change must work for someone running `docker compose up` on a fresh VPS with three values set in `.env`.

## Services

```yaml
# docker-compose.yml (target shape)
services:
  web:    # Next.js + Playwright (chromium)
  db:     # postgres:16 with pgvector, pg_trgm, uuid-ossp
volumes:
  ./storage:/app/storage    # generated PNGs, screenshots, uploads, fonts
  pgdata:/var/lib/postgresql/data
```

The `web` image is ~1.5 GB because Playwright bundles Chromium. Accepted trade-off.

## Required env vars

All env vars are validated at startup via `lib/env.ts` (Zod, fail-fast). Documented in `.env.example`.

```env
# Database
DATABASE_URL=postgresql://bannerwright:bannerwright@db:5432/bannerwright

# Auth (single user)
ADMIN_EMAIL=
ADMIN_PASSWORD_HASH=             # argon2 hash
SESSION_SECRET=                  # 32+ random chars

# AI
GEMINI_API_KEY=

# Storage
STORAGE_DRIVER=local             # 'local' | 's3' (s3 in v2)
STORAGE_PATH=./storage

# Optional (off by default)
SENTRY_DSN=

# Limits — runaway-cost protection
MAX_GENERATIONS_PER_DAY=100
MAX_LLM_COST_USD_PER_DAY=10
```

## Storage layout

```
./storage/
├── workspaces/{workspace_id}/
│   ├── uploads/         # KB uploads (logo, brand assets)
│   ├── screenshots/     # Playwright screenshots from URL ingestion
│   ├── generated/       # Nano Banana outputs
│   └── fonts/           # custom fonts (v2 — disabled in MVP)
└── generations/         # final banner PNGs
```

All paths flow through `lib/storage/`. Never hardcode `./storage/...` in app code.

## CI/CD

GitHub Actions (target):

- Lint, typecheck, unit test on PR
- Build Docker image
- Publish to GHCR on `main` (open-source release)

## Pre-merge checklist

- [ ] `.env.example` updated if new env var
- [ ] `docker-compose.yml` updated if new service
- [ ] `Dockerfile` builds clean
- [ ] No hardcoded paths outside `STORAGE_PATH`
- [ ] No `localhost`-only assumptions (use `process.env.PORT`, etc.)
- [ ] No external service required for happy path (Sentry, S3 are opt-in)
- [ ] README updated if new setup step

## Open-source manners

- **MIT License** — don't change without user approval.
- All public-facing strings (errors, UI) in English.
- README is self-contained: `git clone` → `cp .env.example .env` → fill 3 values → `docker compose up` → it works.
- No telemetry by default. If added later: `ANALYTICS_OPT_IN=true` in `.env`, off by default.
