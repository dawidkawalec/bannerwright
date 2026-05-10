# ADR 0001 — Stack deviations from PRD

**Date:** 2026-05-10
**Status:** Accepted
**Phase:** Faza 0 (Foundations)

## Context

PRD §3 locks down the stack. While scaffolding Faza 0, two pinned versions had moved on since the PRD was written (2026-05-09):

1. **Next.js 15 → 16.** `create-next-app@latest` ships Next.js 16.2.6 with Turbopack, fully backward-compatible with the App Router patterns described in the PRD. There is no remaining reason to pin Next 15.
2. **Lucia Auth v3.** Deprecated by its author with the recommendation that consumers implement session logic directly using `@oslojs/crypto` and `@oslojs/encoding` (≈100 LOC for our single-user case). Continuing to install a deprecated package conflicts with the PRD's "self-host first, minimal deps" principle.

Both deviations preserve every behavioural requirement in the PRD and AGENT_INSTRUCTIONS.

## Decision

- **Use Next.js 16.x** (currently 16.2.6). App Router + Server Actions + Route Handlers behave identically; the only adjustment was renaming `middleware.ts` → `proxy.ts` (Next 16's new convention; the function exports `proxy` instead of `middleware`).
- **Implement sessions manually** in `src/lib/auth/sessions.ts` using `@oslojs/crypto` (SHA-256 for token hashing) and `@oslojs/encoding` (base32). API surface mirrors what Lucia exposed: `generateSessionToken`, `createSession`, `validateSessionToken`, `invalidateSession`, `invalidateAllUserSessions`. Sliding refresh after 50% of lifetime, 30-day cookies.
- **Password hashing** stays on `@node-rs/argon2` (Argon2id, m=19456, t=2, p=1) — same parameters Lucia v3 recommended.

## Consequences

- ✅ Smaller dependency surface; one fewer deprecated package to track.
- ✅ Full control over session semantics (we may add per-device session UI later without working around Lucia's adapter contract).
- ✅ Next 16 brings Turbopack-stable dev (`pnpm dev` boots in ~440 ms for our scaffold).
- ⚠️ The PRD references "Lucia Auth v3" verbatim; new contributors should read this ADR before assuming Lucia is installed.
- ⚠️ Next 16 deprecated `middleware.ts` → `proxy.ts`. Project uses the new convention from day 1.

## References

- PRD §3 (Stack Technologiczny)
- AGENT_INSTRUCTIONS §1.1 (Stack lockdown)
- Lucia deprecation note: https://github.com/lucia-auth/lucia/discussions/1714
- Next.js middleware → proxy migration: https://nextjs.org/docs/messages/middleware-to-proxy
