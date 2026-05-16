# Security policy

## Supported versions

Bannerwright is pre-1.0. **Only the latest `main` is supported** with security fixes. Pinning to an older tag is fine for stability, but vulnerabilities will only be patched against `main` until a stable line ships.

## Reporting a vulnerability

**Please don't open a public GitHub issue** for security problems.

Email: **hello@kawalec.pl**

A few things that help triage:

- A clear description of the issue and its impact.
- A minimal reproduction — version, environment, request sequence.
- Whether the issue is in the self-hosted code or in the hosted instance at `bannerwright.com`.
- Any suggested fix or workaround (optional).

## What to expect

- **Acknowledge within 7 days** of receiving the report.
- **Initial assessment within 14 days** — severity, scope, fix complexity.
- **Coordinated disclosure**: the report stays private until a fix is shipped and self-hosters have a reasonable window (typically 14–30 days) to upgrade. After that, the issue is documented in [CHANGELOG.md](CHANGELOG.md) and disclosed publicly.

## Out of scope

Some classes of reports we don't treat as security issues:

- Self-XSS or social-engineering attacks where the admin is the only user.
- Vulnerabilities in pinned dependencies that have no upstream fix yet — those get tracked in issues, not as security reports.
- Reports against the marketing site (`bannerwright.com` minus `/api/*`) that don't expose user data.
- "You can render arbitrary HTML in a banner" — that's the product. The banner HTML is sandboxed via DOMPurify + isolated render contexts; bypasses of *that* sandbox ARE in scope.

## Bug-bounty

No formal programme. A credit in `CHANGELOG.md` and (for material reports) a thank-you note is all I can offer right now.
