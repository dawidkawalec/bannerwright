# Contributing to Bannerwright

Thanks for the interest. Bannerwright is a small, opinionated project — contributions are welcome, but the bar is "make the workshop better for solo makers and small agencies."

## Before you start

- **Open an issue first** for anything non-trivial. A 30-line bug fix doesn't need one; a new feature, a refactor, or a schema change does. Saves both of us time if we disagree on direction before you build it.
- **Read the source-of-truth docs.** [AGENTS.md](AGENTS.md) for the stack and conventions, [PRD.md](PRD.md) for product scope, [docs/architecture.md](docs/architecture.md) for module boundaries. Twenty minutes of reading saves an hour of review feedback.
- **The license is MIT.** By opening a PR you agree your contribution is licensed under MIT. See [LICENSE](LICENSE).

## What gets accepted

- Bug fixes with a clear reproduction case.
- Documentation improvements (typos, clarifications, missing sections).
- Small, well-scoped features that match the spirit of the PRD.
- Performance fixes with before/after numbers.

## What gets pushed back

- Multi-tenancy or registration work — Bannerwright is single-tenant by design until further notice ([ADR 0005](docs/decisions/0005-licensing-and-release-strategy.md)).
- New AI providers — we're committed to Gemini until there's a strong reason otherwise.
- New runtime dependencies (Redis, BullMQ, message queues, etc.) — current architecture deliberately avoids them.
- Sweeping refactors without a prior issue.

## Development setup

Local dev is **not** the primary workflow — Bannerwright ships through the VPS-only `pnpm ship` pipeline. But to validate a change locally before opening a PR:

```bash
git clone https://github.com/dawidkawalec/bannerwright
cd bannerwright
pnpm install
cp .env.example .env       # fill in 3-4 values, see comments
docker compose up -d db    # local Postgres
pnpm db:migrate
pnpm dev
```

That's enough to type-check, lint, and run unit tests. Anything UI-heavy is easier to validate on the deployed instance.

## Pull request hygiene

- **One concern per PR.** Don't bundle a bug fix with a refactor.
- **Type-check + lint must pass.** `pnpm typecheck && pnpm lint` locally before pushing.
- **Tests where it matters.** Every Server Action that touches the DB and every `lib/ai/` helper benefits from a Vitest test. UI tweaks don't need one.
- **Update [CHANGELOG.md](CHANGELOG.md)** under the `[Unreleased]` section if your change is user-visible.
- **Commit messages**: short, present-tense subject line. Body explains *why*, not *what* — the diff already shows *what*.

## Communication

- **Issues** for bugs, ideas, and design questions.
- **Discussions** (when we open them) for "how do you do X" questions.
- **Security issues**: don't open a public issue. See [SECURITY.md](SECURITY.md).

## Code of conduct

Be decent. Personal attacks, harassment, or bigotry get you removed from the project without warning. There's no formal CoC document — the operator's judgement is the rule.
