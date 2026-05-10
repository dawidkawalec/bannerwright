# Bannerwright

> A workshop for makers of banners. Self-hostable, open-source AI graphics generator that turns a brief + brand context into editable HTML banners (PNG export).

**Status:** Faza 0 (Foundations) — scaffold, auth, workspaces CRUD, render skeleton. AI pipeline lands in Faza 2.

## Quickstart (self-hosted)

```bash
git clone https://github.com/dawidkawalec/bannerwright.git
cd bannerwright
cp .env.example .env

# Generate the admin password hash (replace <password>)
docker compose run --rm web pnpm tsx scripts/hash-password.ts <password>
# Paste the hash into ADMIN_PASSWORD_HASH in .env
# Then: openssl rand -hex 32  → SESSION_SECRET
# And: paste your Gemini API key into GEMINI_API_KEY

docker compose up -d db
docker compose run --rm web pnpm db:migrate
docker compose run --rm web pnpm db:seed
docker compose up
```

Open http://localhost:3000 and sign in.

## Local development

```bash
pnpm install
docker compose up -d db
pnpm db:migrate
pnpm db:seed
pnpm dev
```

## Project layout & conventions

- [AGENTS.md](AGENTS.md) — entrypoint for AI agents working on this codebase
- [PRD.md](PRD.md) — full product spec
- [docs/](docs/) — architecture, database, API, AI pipeline, deployment

## Roadmap

See [docs/development-phases.md](docs/development-phases.md). Six phases to OSS release.

## License

MIT.
