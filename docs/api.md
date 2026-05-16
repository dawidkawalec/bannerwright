# API

Two surface areas: **Server Actions** for UI mutations, **Route Handlers** for streaming, file I/O, and internal services. Auth check enforced in `middleware.ts` for everything except `/login`.

## Auth (Route Handlers)

```
POST   /api/auth/login          → email + password → Set-Cookie session
POST   /api/auth/logout         → invalidate session
GET    /api/auth/me             → current user (or 401)
```

## Workspaces

**Server Actions** (`app/actions/workspaces.ts`):

```ts
createWorkspace({ name, description?, slug? })
updateWorkspace(id, partial)
deleteWorkspace(id)
setBrandColors(id, colors)
uploadLogo(id, file)
```

**Route Handlers:**

```
GET    /api/workspaces              → list
GET    /api/workspaces/[id]         → detail (+ counts)
GET    /api/workspaces/[id]/logo    → serve logo file
```

## Knowledge Base

**Server Actions** (`app/actions/kb.ts`):

```ts
addKbSourceUrl(workspaceId, url)        // fire-and-forget Playwright job, status in DB
addKbSourceUpload(workspaceId, file)
addKbSourceText(workspaceId, title, text)
deleteKbSource(id)
reprocessKbSource(id)
```

**Route Handlers:**

```
GET    /api/kb/[id]/screenshot   → serve screenshot PNG
GET    /api/kb/[id]/file         → serve uploaded file
POST   /api/kb/[id]/process      → trigger reprocess (debug)
```

## Generations (core)

**Streaming Route Handlers:**

```
POST   /api/generations
       Body: { workspaceId, format, brief, sourceTemplateId? }
       SSE events:
         {type:"progress", step:"analyzing_kb"|"generating_html"|"rendering_png"}
         {type:"partial_html", html:"..."}
         {type:"done", generationId, versionId, htmlFinal, pngUrl}

POST   /api/generations/[id]/edit
       Body: { instruction }
       SSE events: same shape as above (new versionId)

POST   /api/generations/[id]/render-png    → force re-render current HTML
GET    /api/generations/[id]/png           → serve current PNG
GET    /api/generations/[id]/png?v={vid}   → serve version PNG (lazy generate)
```

**SSE format:**

```
data: {"type":"partial_html","html":"<div..."}\n\n
data: {"type":"done","generationId":"...","htmlFinal":"...","pngUrl":"..."}\n\n
```

Use `ReadableStream` API directly — no third-party SSE libs.

**Server Actions** (`app/actions/generations.ts`):

```ts
updateGenerationHtml(id, html, source: 'manual' | 'ai')   // creates new version
restoreVersion(generationId, versionId)                    // creates new version with old HTML
duplicateGeneration(id)
promoteToTemplate(id, templateName)
unpromoteTemplate(id)
deleteGeneration(id)
```

**Read endpoints:**

```
GET    /api/generations?workspaceId=...&isTemplate=...
GET    /api/generations/[id]
GET    /api/generations/[id]/versions
GET    /api/generations/[id]/chat
```

## Internal

```
POST   /api/internal/render
       Body: { html, format, generationId? }
       → { pngBuffer | { pngPath } }
```

Internal-only: same-origin check + auth. Never exposed externally.

## Waitlist (private-beta access)

**Server Actions** (`app/actions/waitlist.ts`):

```ts
submitWaitlist({ email, name?, useCase?, source? })   // public (no auth) — Zod validates, inserts with ON CONFLICT DO NOTHING
```

**Admin Server Actions** (`app/account/waitlist/actions.ts`, require auth):

```ts
setSignupStatus({ id, status, notes? })   // 'pending' | 'contacted' | 'installed' | 'declined'
removeSignup(id)
```

Stored in `waitlist_signups`. Full flow + alternatives considered: [ADR-0004](decisions/0004-waitlist-and-access-flow.md).

## Health

```
GET    /api/health    → { status, version, db, browser }
```

## Conventions

- Server Actions return `{ ok: true, data } | { ok: false, error }`. Never throw to the UI.
- Route Handlers return `NextResponse.json({ error })` with proper HTTP status.
- All AI and Playwright calls wrapped in try/catch; structured logging via `pino`.
- Never leak stack traces to users — log them server-side, return user-friendly messages.
