# ADR 0004 — Waitlist as the private-beta access flow

**Date:** 2026-05-16
**Status:** Implemented (Faza 0 pre-MVP polish)

## Context

The marketing site at https://bannerwright.com runs a `Now in private beta — request early access →` banner and a `Request early access` CTA in the hero + final-CTA sections. Until now those CTAs were dead-ends: the banner scrolled to a section that pointed at `/login`, and `/login` is a single-tenant admin gate with **no public registration**. Anyone who hit "request access" got no actual path to access.

We need a real mechanism that:

1. Captures interested users without giving them a self-service account (we're not multi-tenant yet).
2. Lets the operator (single admin) review signups, decide who gets access, and reach out with the self-host guide.
3. Stays lightweight — no email service, no waitlist SaaS, no marketing automation.

## Decision

Run a **synchronous waitlist** stored in our existing Postgres, surfaced through a dialog from the marketing CTAs and managed from a `/account/waitlist` admin view. No email integration on day one — admin reads the list and reaches out manually.

### Schema

[src/lib/db/schema.ts](../../src/lib/db/schema.ts) — `waitlist_signups`:

| Column        | Type           | Notes                                                                       |
|---------------|----------------|-----------------------------------------------------------------------------|
| `id`          | `uuid` PK      | `gen_random_uuid()`                                                         |
| `email`       | `text` UNIQUE  | Stored lowercased + trimmed via Zod                                          |
| `name`        | `text?`        | Optional                                                                    |
| `use_case`    | `text?`        | Optional one-liner                                                          |
| `source`      | `text?`        | `announcement_banner` \| `final_cta` \| `direct` \| `docs` \| `other`        |
| `status`      | `text` NOT NULL| `pending` \| `contacted` \| `installed` \| `declined` (default `pending`)    |
| `notes`       | `text?`        | Admin notes                                                                 |
| `created_at`  | `timestamptz`  | `now()`                                                                     |
| `contacted_at`| `timestamptz?` | Stamped when admin flips to `contacted`                                     |

Indexes: `(status, created_at)` and `(created_at)`.

### Flow

1. Visitor clicks any `Request early access` CTA on the LP → opens [`<WaitlistDialog />`](../../src/components/landing/waitlist-dialog.tsx) with email + name + use-case form.
2. Submit → Server Action [`submitWaitlist`](../../src/app/actions/waitlist.ts) → Zod validates, inserts with `ON CONFLICT (email) DO NOTHING`.
3. Visitor sees "You're on the list" success panel; toast confirms.
4. Admin opens [`/account/waitlist`](../../src/app/account/waitlist/page.tsx) → sees all signups with status badges, can flip status (pending → contacted → installed) via inline `<Select>`, or delete spam.
5. When admin flips to `contacted`, `contacted_at` is stamped.

### Why no email automation yet

- We have no transactional email provider integrated.
- Single admin can copy-paste a templated welcome email from their own client until volume justifies automation.
- Avoid premature dependency (no SES, Resend, Postmark, or webhook) — Phase 2 concern.

### Anti-spam posture

Minimal for now: Zod-validated email, unique constraint, optional manual `declined` status. If/when bots find the form, add Cloudflare Turnstile or rate-limit by IP hash in the server action.

## Alternatives considered

- **Plain mailto:** link. Rejected — no record, no funnel data, awful UX.
- **Tally / Typeform embed.** Rejected — third-party dep, dead-end if the service changes, and we already own the DB.
- **Open self-service registration.** Rejected — product is single-tenant; opening signups means rebuilding multi-tenancy first. That's a Phase 3 (SaaS) move, see [ADR 0005](0005-licensing-and-release-strategy.md).

## Implementation map

| File                                                                                        | Role                                                          |
|---------------------------------------------------------------------------------------------|----------------------------------------------------------------|
| [src/lib/db/schema.ts](../../src/lib/db/schema.ts)                                          | `waitlist_signups` table + types                              |
| [src/lib/db/migrations/0002_rapid_phalanx.sql](../../src/lib/db/migrations/)                | Generated migration                                            |
| [src/app/actions/waitlist.ts](../../src/app/actions/waitlist.ts)                            | `submitWaitlist` Server Action with Zod                       |
| [src/lib/db/queries/waitlist.ts](../../src/lib/db/queries/waitlist.ts)                      | `listWaitlistSignups`, `getWaitlistStats`, status mutations    |
| [src/components/landing/waitlist-dialog.tsx](../../src/components/landing/waitlist-dialog.tsx) | Dialog + form, success panel, source tracking                  |
| [src/components/landing/announcement-banner.tsx](../../src/components/landing/announcement-banner.tsx) | Trigger for top banner                                         |
| [src/components/landing/hero-b.tsx](../../src/components/landing/hero-b.tsx) (Request early access) | Hero CTA trigger                                               |
| [src/components/landing/final-cta.tsx](../../src/components/landing/final-cta.tsx)          | Final CTA trigger                                              |
| [src/app/account/waitlist/](../../src/app/account/waitlist/)                                | Admin view + status/delete actions                             |

## Open follow-ups

1. **Email outreach automation.** When the operator gets to 20+ signups, plug Resend or Postmark into a `contactSignup(id, templateId)` action and add `email_sent_at` to the schema.
2. **Source attribution.** Track UTM params (`?utm_source=…`) and persist them next to `source` for clearer funnel analysis.
3. **Public roadmap link in the success panel.** Once `ROADMAP.md` is live on the public site, link to it so users have something to read while they wait.
