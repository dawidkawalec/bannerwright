# PRD: Bannerwright — A Workshop for Makers of Banners

**Wersja:** 1.0
**Data:** 9 maja 2026
**Status:** Ready for development
**Repo:** github.com/[org]/bannerwright (TBD)
**Domena:** bannerwright.com
**License:** MIT
**Stack:** Next.js 15 + Postgres + Playwright + Gemini 3.1 Pro + Nano Banana Pro

---

## 0. Philosophy

**A wright is a maker.** A *shipwright* builds ships. A *playwright* writes plays. A *wheelwright* turns wood into motion. The suffix is one of the oldest in English — it survives in titles, not in marketing. It signals craft, not output.

**Bannerwright is a tool for makers of banners.** Not a "platform". Not an "AI-powered creative suite". Not a "visual content engine". A workshop. You bring the brand, the brief, the constraints. The tool brings speed, consistency, and the deterministic part of the work — the part that should never have been manual in the first place.

### Three principles

**1. Banners are HTML.** Not bitmaps you can't edit. Not magic black-box outputs. Not Figma files locked in someone's account. HTML — the most legible, durable, hackable format the web has ever produced. If you can read it, you can change it. If an LLM can read it, an LLM can change it. The PNG is just the export.

**2. Craft is iterative, not generative.** AI doesn't "make" the banner. AI scaffolds it. You — or your AI agent — refine it. Every edit creates a version. Every version is recoverable. No work is lost. No "regenerate" button erases an hour of tweaks. The history is the workshop floor.

**3. Self-hostable by default.** Your brand assets, your client data, your generations — they live on your infrastructure. Open source isn't a marketing layer; it's the architecture. Anyone who wants to fork, extend, audit, or run it offline can. The hosted SaaS is a convenience, not a moat.

### Who it's for

Freelancers running social for ten clients. Small agencies that don't want to pay per-seat for Canva. Solo founders who'd rather ship banners than learn Photoshop. Developers who think Bannerbear is fine but want the engine, not the API. Anyone who'd rather see the HTML than not.

### What it isn't

It isn't Canva. It isn't Midjourney. It isn't a brand-strategy AI. It won't write your copy strategy. It won't optimize your ad spend. It won't replace your designer for the campaign that actually matters. It will make Tuesday's promo banner in four minutes instead of forty. That's the deal.

---

## 1. Executive Summary

### Problem
Tworzenie grafik na social media (FB ads, IG posty, LinkedIn carousels) to czasochłonny, powtarzalny proces. Freelancerzy SoMe i małe agencje:
- Tracą godziny na ręczne klikanie w Canvie / Photoshopie dla każdego klienta
- Muszą za każdym razem manualnie pilnować spójności brandowej (kolory, fonty, ton)
- Generatory AI typu "image gen end-to-end" (Midjourney, Nano Banana solo) dają piękne obrazki, ale brak typografii, edycji tekstu i brand consistency
- Narzędzia "wizualne" typu Bannerbear / Placid wymagają ręcznego budowania szablonów i nie mają warstwy AI rozumiejącej brand

### Rozwiązanie
**Bannerwright** — self-hostowalna, open-source aplikacja, która łączy:
1. **Bazę wiedzy o kliencie** (URL strony + uploady) automatycznie analizowaną przez Gemini 3.1 Pro
2. **Generowanie grafik jako HTML** (deterministyczne, edytowalne, idealna typografia)
3. **AI agent edycyjny** ("zmień tło na niebieskie", "powiększ CTA")
4. **Generowanie teł / elementów** przez Nano Banana Pro (Gemini 3 Pro Image)
5. **Export do PNG** przez Playwright (pixel-perfect)

### Cel biznesowy
- **Faza 1 (MVP):** Internal tool dla Craftweb / Bluebee — przyspieszenie produkcji grafik dla klientów
- **Faza 2:** Open source release na GitHubie — zbudowanie społeczności, traction, lead-gen
- **Faza 3:** Hosted SaaS layer (~$9-19/mc) dla freelancerów, którzy nie chcą self-hostować

### Główny użytkownik (MVP)
**Persona:** Dawid (Founder Craftweb) i zespół Bluebee — techniczni operatorzy obsługujący kilku klientów brandowych, komfortowi z kodem, oczekujący szybkości i kontroli.

**Persona docelowa (v2/v3):** Freelancer SoMe / mała agencja prowadząca 5-15 klientów, technicznie świadomy, woli kontrolę i open source nad SaaS lock-in.

### Out of scope (świadomie)
- Multi-tenancy / multi-user (jeden user = jedna instancja)
- Billing / subskrypcje (to w SaaS layer, nie w open source core)
- Mobile app
- Video / animowane grafiki
- Marketplace szablonów
- Bezpośrednia publikacja na FB/IG/LinkedIn
- A/B testing kreacji
- Analytics / performance tracking

---

## 2. Architektura

### High-level diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Browser (Single User)                    │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Next.js 15 App (App Router + RSC)                  │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────┐   │    │
│  │  │ Workspaces   │  │ Editor       │  │ Knowledge│   │    │
│  │  │ List/CRUD    │  │ (Monaco +    │  │ Base UI  │   │    │
│  │  │              │  │  iframe +    │  │          │   │    │
│  │  │              │  │  AI chat)    │  │          │   │    │
│  │  └──────────────┘  └──────────────┘  └──────────┘   │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                            │ HTTPS
                            ▼
┌─────────────────────────────────────────────────────────────┐
│         Next.js API Routes (Server Actions + Route Handlers)│
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐    │
│  │ Auth     │ │ Generate │ │ Render   │ │ Knowledge    │    │
│  │ (Lucia)  │ │ HTML     │ │ PNG      │ │ Ingestion    │    │
│  │          │ │ via LLM  │ │ via      │ │ via          │    │
│  │          │ │          │ │ Playwr.  │ │ Playwright   │    │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────┘    │
│                            │                                │
│                            ▼                                │
│         lib/renderer/ (separate module — future split)      │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
┌──────────────┐   ┌──────────────┐    ┌──────────────────┐
│ Postgres 16  │   │ Local FS     │    │ External APIs    │
│ + pgvector   │   │ ./storage/   │    │ - Gemini 3.1 Pro │
│ (RAG ready)  │   │ (PNG, fonts, │    │ - Nano Banana Pro│
│              │   │  uploads)    │    │   (Gemini 3 Pro  │
│              │   │              │    │    Image)        │
└──────────────┘   └──────────────┘    └──────────────────┘
```

### Decyzje architektoniczne

**1. Monolith Next.js 15 (App Router)**
- Wybrane dla: szybkości developmentu, RSC + Server Actions, jeden proces, jeden Dockerfile
- Trade-off: Playwright + Chromium w obrazie ~1.5GB, dłuższy build (akceptowalne)
- Refactor path: `lib/renderer/` jest wydzielony jako moduł — w v2/SaaS wyciągniemy do osobnego serwisu Fastify

**2. Single-tenant, single-user**
- `.env`: `ADMIN_EMAIL` + `ADMIN_PASSWORD_HASH`
- Lucia Auth z session cookies (bez OAuth, bez registration flow)
- Multi-tenancy = osobna warstwa w SaaS, nie w core open source

**3. Postgres + pgvector (RAG ready, RAG wyłączony)**
- 1M context Gemini 3.1 Pro pokrywa 100% przewidywalnych use-case'ów MVP
- pgvector extension zainstalowane od dnia 1, ale tabela `embeddings` pusta i nieużywana
- Jeśli klient wrzuci 500-stronicowy brand book → włączamy RAG bez migracji infra

**4. Playwright shared między ingestion i render**
- Jeden long-running browser instance (lazy-loaded singleton)
- Reuse dla: screenshot strony klienta (KB ingestion) + render HTML→PNG (export)
- Browser pool: 1 browser, max 3 contexts concurrent (queue dla większego load'u w v2)

**5. Local filesystem do storage (zamiast S3)**
- Self-hosted = zero zewnętrznych zależności
- `./storage/` zamontowane jako volume w docker-compose
- Adapter pattern w `lib/storage/` — w SaaS podmienimy na S3/R2 bez ruszania logiki

---

## 3. Stack Technologiczny

### Frontend
| Komponent | Wybór | Uzasadnienie |
|-----------|-------|--------------|
| Framework | Next.js 15 (App Router) | RSC, Server Actions, jeden runtime |
| Language | TypeScript 5.x (strict) | Mniej bugów, lepszy DX |
| Styling | Tailwind CSS 4 | Szybkość, znamy z innych projektów |
| UI components | shadcn/ui | Owned components, nie biblioteka |
| Code editor | Monaco Editor (`@monaco-editor/react`) | Ten sam co VS Code, syntax highlighting HTML |
| Forms | React Hook Form + Zod | Type-safe forms |
| Data fetching | Server Components + Server Actions | Domyślnie; TanStack Query tylko dla optimistic updates w edytorze |
| State (client) | Zustand (tylko dla edytora) | Lekki, zero boilerplate |
| Icons | Lucide React | Spójne, tree-shake'owalne |

### Backend
| Komponent | Wybór | Uzasadnienie |
|-----------|-------|--------------|
| Runtime | Node.js 22 LTS | Aktualny LTS, native fetch |
| API | Next.js Route Handlers + Server Actions | Brak osobnego backendu w MVP |
| ORM | Drizzle ORM | Type-safe, lekki, świetnie z Postgres |
| Validation | Zod | Współdzielony schema FE/BE |
| Auth | Lucia Auth v3 | Lightweight, no vendor lock |
| Browser automation | Playwright 1.x (chromium) | HTML→PNG + scraping URL |
| LLM SDK | `@google/genai` (oficjalny SDK) | Gemini 3.1 Pro + Nano Banana Pro |

### Baza danych
| Komponent | Wybór | Uzasadnienie |
|-----------|-------|--------------|
| RDBMS | PostgreSQL 16 | Sprawdzony, JSONB, full-text search |
| Extensions | `pgvector`, `pg_trgm`, `uuid-ossp` | Ready dla RAG i fuzzy search |
| Migrations | `drizzle-kit` | SQL-first, czytelne migracje |

### AI / ML
| Use case | Model | Powód |
|----------|-------|-------|
| Generowanie HTML grafiki | **Gemini 3.1 Pro** (`gemini-3.1-pro-preview`) | 1M context, świetny SWE/instruction following, multimodal (zdjęcia ze strony klienta + brand assets w jednym promptie) |
| Edycja HTML przez chat | **Gemini 3.1 Pro** | Spójność z generowaniem, full HTML rewrite approach |
| Analiza KB / brand extraction | **Gemini 3.1 Pro** | Multimodal — wciąga screenshot strony klienta + tekst |
| Tańsze operacje (np. tagowanie, summarization) | **Gemini 3.1 Flash** (`gemini-3.1-flash-preview`) | Free tier dostępny, 10x tańszy |
| Generowanie teł / elementów | **Nano Banana Pro** (`gemini-3-pro-image-preview`) | High quality image gen, ten sam ekosystem |
| Tańsze grafiki (icons, patterns) | **Nano Banana 2** (`gemini-3.1-flash-image-preview`) | High-volume, niższa cena |

### Infrastructure / DevOps
| Komponent | Wybór | Uzasadnienie |
|-----------|-------|--------------|
| Containerization | Docker + docker-compose | Standard self-hostingu |
| CI/CD (do repo) | GitHub Actions | Lint, test, build images |
| Monitoring (opt-in) | Sentry SDK (lazy) | User wpisuje DSN w `.env`, default: off |
| Logs | `pino` (JSON structured) | Performance, łatwo parsować |

### Storage
| Asset | Lokalizacja MVP | Future (SaaS) |
|-------|-----------------|----------------|
| Wygenerowane PNG | `./storage/generations/{generation_id}.png` | S3 / R2 |
| Uploady KB (logo, brand assets) | `./storage/workspaces/{workspace_id}/uploads/` | S3 / R2 |
| Screenshoty stron klienta | `./storage/workspaces/{workspace_id}/screenshots/` | S3 / R2 |
| Custom fonty (per workspace) | `./storage/workspaces/{workspace_id}/fonts/` | S3 / R2 |

---

## 4. Schemat bazy danych

```sql
-- ================================================
-- AUTH (single-user, ale schemat ready dla multi)
-- ================================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE sessions (
  id TEXT PRIMARY KEY,                    -- Lucia session id
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL
);

-- ================================================
-- WORKSPACES (klient brandowy: "Nike", "Adidas")
-- ================================================
CREATE TABLE workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  brand_colors JSONB,                     -- {"primary": "#FF0000", "secondary": "#000", "accent": "#fff"}
  brand_fonts JSONB,                      -- {"headline": "Inter", "body": "Inter"}
  logo_url TEXT,                          -- relative path do storage
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, slug)
);

CREATE INDEX idx_workspaces_user_id ON workspaces(user_id);

-- ================================================
-- KNOWLEDGE BASE (per workspace)
-- ================================================
CREATE TABLE kb_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL CHECK (source_type IN ('url', 'upload', 'text')),
  title TEXT NOT NULL,
  url TEXT,                               -- dla source_type='url'
  file_path TEXT,                         -- dla source_type='upload'
  content_text TEXT,                      -- wyekstraktowany tekst
  screenshot_path TEXT,                   -- dla source_type='url' — Playwright screenshot
  metadata JSONB,                         -- { "favicon": "...", "title": "...", "ogImage": "..." }
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'ready', 'failed')),
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

CREATE INDEX idx_kb_sources_workspace_id ON kb_sources(workspace_id);
CREATE INDEX idx_kb_sources_status ON kb_sources(status);

-- RAG ready (puste w MVP)
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE kb_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID NOT NULL REFERENCES kb_sources(id) ON DELETE CASCADE,
  chunk_text TEXT NOT NULL,
  chunk_index INTEGER NOT NULL,
  embedding vector(768),                  -- dla text-embedding-004 (Gemini)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_kb_embeddings_source_id ON kb_embeddings(source_id);
-- HNSW index dorzucamy gdy faktycznie używamy:
-- CREATE INDEX ON kb_embeddings USING hnsw (embedding vector_cosine_ops);

-- ================================================
-- TEMPLATES (promoted generations)
-- Hybryda: każda generacja MOŻE być promotowana do template
-- ================================================
-- Template = generation z is_template=true (patrz niżej)
-- Brak osobnej tabeli; query: SELECT * FROM generations WHERE is_template = true

-- ================================================
-- GENERATIONS (konkretne grafiki)
-- ================================================
CREATE TABLE generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  parent_generation_id UUID REFERENCES generations(id) ON DELETE SET NULL,
                                          -- "duplicate from" — track origin
  title TEXT NOT NULL,
  format TEXT NOT NULL CHECK (format IN (
    'square_1080',      -- 1080x1080  (IG/FB post)
    'story_1080_1920',  -- 1080x1920  (Story / Reels cover)
    'landscape_1200_628', -- 1200x628 (FB / LinkedIn link preview)
    'portrait_1200_1500'  -- 1200x1500 (IG portrait — najbardziej angażujący)
  )),
  current_html TEXT NOT NULL,             -- aktualna wersja HTML
  current_png_path TEXT,                  -- ostatni wyrenderowany PNG
  brief TEXT,                             -- co user zlecił przy tworzeniu
  is_template BOOLEAN NOT NULL DEFAULT FALSE,
  template_name TEXT,                     -- jeśli is_template
  thumbnail_path TEXT,                    -- mały preview do listy
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_generations_workspace_id ON generations(workspace_id);
CREATE INDEX idx_generations_is_template ON generations(workspace_id, is_template)
  WHERE is_template = TRUE;
CREATE INDEX idx_generations_parent ON generations(parent_generation_id)
  WHERE parent_generation_id IS NOT NULL;

-- ================================================
-- GENERATION VERSIONS (history snapshotów HTML)
-- ================================================
CREATE TABLE generation_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  generation_id UUID NOT NULL REFERENCES generations(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,        -- 1, 2, 3...
  html TEXT NOT NULL,
  triggered_by TEXT NOT NULL CHECK (triggered_by IN (
    'initial_generation', 'manual_edit', 'ai_edit', 'restore'
  )),
  ai_prompt TEXT,                         -- jeśli triggered_by='ai_edit'
  png_path TEXT,                          -- snapshot PNG (opcjonalnie, lazy)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (generation_id, version_number)
);

CREATE INDEX idx_versions_generation_id ON generation_versions(generation_id, version_number DESC);

-- ================================================
-- CHAT MESSAGES (per generation — historia rozmowy z AI)
-- ================================================
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  generation_id UUID NOT NULL REFERENCES generations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  resulted_in_version_id UUID REFERENCES generation_versions(id) ON DELETE SET NULL,
  tokens_used INTEGER,                    -- dla cost tracking
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_chat_messages_generation_id ON chat_messages(generation_id, created_at);

-- ================================================
-- USAGE TRACKING (LLM costs — pomocne dla SaaS later)
-- ================================================
CREATE TABLE llm_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL,
  generation_id UUID REFERENCES generations(id) ON DELETE SET NULL,
  model TEXT NOT NULL,                    -- 'gemini-3.1-pro-preview' itp.
  operation TEXT NOT NULL,                -- 'generate', 'edit', 'kb_analyze', 'image_gen'
  input_tokens INTEGER NOT NULL DEFAULT 0,
  output_tokens INTEGER NOT NULL DEFAULT 0,
  cost_usd NUMERIC(10, 6),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_llm_usage_workspace_created ON llm_usage(workspace_id, created_at DESC);
```

### Notatki do schematu

- **Brak osobnej tabeli `templates`** — `is_template` flag na `generations` realizuje hybrydę 1c (każda generacja może być promotowana do templatu)
- **`parent_generation_id`** umożliwia traceability gdy user duplikuje grafikę z templatu — wiemy z czego wzięta
- **`generation_versions`** to history snapshotów po KAŻDEJ edycji (manual lub AI). Daje undo/redo i killer-feature "wróć do wersji 3"
- **PNG cache:** `current_png_path` na `generations` (zawsze aktualny) + opcjonalnie `png_path` na każdej wersji (lazy — generujemy tylko jeśli user kliknie "view version")
- **`llm_usage`** — od dnia 1 trackujemy koszty per workspace; w SaaS to fundament billingu
- **`kb_embeddings`** — schemat istnieje, w MVP tabela jest pusta. Włączenie RAG to dorzucenie 1 worker'a + index HNSW

---

## 5. API Endpoints

### Konwencja
- App Router — **Server Actions** dla mutacji wywołanych z UI
- **Route Handlers** (`app/api/.../route.ts`) dla:
  - Streaming responses (LLM, render progress)
  - File uploads / downloads
  - Webhooks (none w MVP, future)
- Auth check w middleware (`middleware.ts`) dla wszystkich `/api/*` i wszystkich page route'ów poza `/login`

### 5.1 Auth
```
POST   /api/auth/login          → email + password → Set-Cookie session
POST   /api/auth/logout         → invalidate session
GET    /api/auth/me             → current user (lub 401)
```

### 5.2 Workspaces
**Server Actions:**
```typescript
// app/actions/workspaces.ts
async function createWorkspace(input: { name, description?, slug? })
async function updateWorkspace(id, input: Partial<...>)
async function deleteWorkspace(id)
async function setBrandColors(id, colors: BrandColors)
async function uploadLogo(id, file: File)
```

**Route Handlers:**
```
GET    /api/workspaces                  → list
GET    /api/workspaces/[id]             → detail (+ counts)
GET    /api/workspaces/[id]/logo        → serve logo file
```

### 5.3 Knowledge Base
**Server Actions:**
```typescript
async function addKbSourceUrl(workspaceId, url)
  // → tworzy kb_sources row, kicks off background Playwright job
async function addKbSourceUpload(workspaceId, file)
async function addKbSourceText(workspaceId, title, text)
async function deleteKbSource(id)
async function reprocessKbSource(id)
```

**Route Handlers:**
```
GET    /api/kb/[id]/screenshot          → serve screenshot PNG
GET    /api/kb/[id]/file                → serve uploaded file
POST   /api/kb/[id]/process             → trigger reprocess (admin/debug)
```

### 5.4 Generations (core)
**Route Handlers (streaming):**
```
POST   /api/generations
       Body: { workspaceId, format, brief, sourceTemplateId? }
       → SSE stream:
         data: { type: 'progress', step: 'analyzing_kb' }
         data: { type: 'progress', step: 'generating_html' }
         data: { type: 'partial_html', html: '...' }      // streamed chunks
         data: { type: 'rendering_png' }
         data: { type: 'done', generationId, htmlFinal, pngUrl }

POST   /api/generations/[id]/edit
       Body: { instruction: string }
       → SSE stream (same pattern):
         data: { type: 'partial_html', html: '...' }
         data: { type: 'done', versionId, htmlFinal, pngUrl }

POST   /api/generations/[id]/render-png  → force re-render current HTML
GET    /api/generations/[id]/png         → serve PNG
GET    /api/generations/[id]/png?v={vid} → serve specific version PNG (lazy gen)
```

**Server Actions:**
```typescript
async function updateGenerationHtml(id, html, source: 'manual' | 'ai')
  // Manual edit z Monaco editor; tworzy nowy version snapshot
async function restoreVersion(generationId, versionId)
  // Tworzy nową wersję z HTML starej wersji; zachowuje historię
async function duplicateGeneration(id)
async function promoteToTemplate(id, templateName)
async function unpromoteTemplate(id)
async function deleteGeneration(id)
```

**Route Handlers (read):**
```
GET    /api/generations?workspaceId=...&isTemplate=...
GET    /api/generations/[id]
GET    /api/generations/[id]/versions
GET    /api/generations/[id]/chat       → chat history
```

### 5.5 Internal — Render service
```
POST   /api/internal/render
       Body: { html, format, generationId? }
       → { pngBuffer (binary) | { pngPath } }
```
Wewnętrzny endpoint używany przez Server Actions; nie wystawiany na zewnątrz (auth + same-origin check).

### 5.6 Health / Ops
```
GET    /api/health                      → { status: 'ok', version, db, browser }
```

---

## 6. AI Pipeline — szczegóły

### 6.1 Knowledge Base ingestion (URL)

```
1. User: addKbSourceUrl(workspaceId, "https://klient.com")
2. Insert kb_sources row (status='pending')
3. Background job (BullMQ ZBĘDNE w MVP — używamy "fire and forget" Promise z try/catch + status update):
   a. Playwright: navigate → wait('networkidle') → screenshot full page
   b. Extract: title, og:image, favicon, meta description, body text (max 50k chars)
   c. Save screenshot do ./storage/workspaces/{wid}/screenshots/{kbid}.png
   d. UPDATE kb_sources SET status='ready', content_text=..., screenshot_path=...,
      metadata=..., processed_at=NOW()
4. UI poll'uje status (lub SSE — TBD, prosty interval w MVP)
```

### 6.2 Brand extraction (auto-fill brand_colors / brand_fonts)

Trigger: button "Auto-detect brand" w workspace settings.
```
1. Pobierz wszystkie kb_sources gdzie status='ready'
2. Build prompt do Gemini 3.1 Pro:
   - System: "Jesteś brand strategist. Przeanalizuj te materiały i wyekstrahuj brand identity."
   - User: [tekst kb_sources] + [screenshoty jako image parts]
   - Output schema (Zod + structured output):
     {
       primaryColor: hex,
       secondaryColor: hex,
       accentColor: hex,
       headlineFont: string (closest Google Font),
       bodyFont: string,
       brandTone: 'professional' | 'casual' | 'playful' | 'luxury' | 'minimalist',
       industry: string,
       keyMessages: string[]
     }
3. UPDATE workspaces SET brand_colors=..., brand_fonts=...
```

### 6.3 Generowanie grafiki (initial)

```
Input:
  - workspaceId (pełny kontekst: kb, brand, logo)
  - format ('square_1080' | ...)
  - brief: "Promo wyprzedaży zimowej, 30% off, deadline 15 grudnia"
  - sourceTemplateId? (jeśli user wybrał template jako bazę)

Pipeline:
  1. Build mega-prompt do Gemini 3.1 Pro:
     - System prompt (HTML graphic generator persona, constraints, format dimensions)
     - Brand context: colors, fonts, logo URL, brand tone
     - KB context: top 5 kb_sources (truncated do ~10k tokens każdy)
     - KB screenshots (wszystkie jako image parts — multimodal)
     - User brief
     - (Opcjonalnie) source template HTML jako "use this as starting point"
     - Output instruction: "Return ONLY HTML. Inline CSS. No external dependencies except fonts via @import url(google fonts). Use viewport {WIDTH}x{HEIGHT}px exactly."

  2. Stream response z Gemini SDK
     → push partial chunks do SSE
     → user widzi HTML "rosnący" w iframe live (via debounced re-render)

  3. Po zakończeniu:
     a. INSERT generations (current_html, brief, format, ...)
     b. INSERT generation_versions (version_number=1, triggered_by='initial_generation')
     c. INSERT chat_messages (assistant, content=brief opisu co wygenerował)

  4. Render PNG przez Playwright:
     a. Otwórz nową stronę w existing browser instance
     b. setViewport(WIDTH, HEIGHT) zgodnie z formatem
     c. setContent(html) + waitForLoadState('networkidle')
     d. page.screenshot({ type: 'png', omitBackground: false })
     e. Save do ./storage/generations/{generation_id}.png
     f. UPDATE generations SET current_png_path=...

  5. Stream final event do UI: { type: 'done', ... }
```

**Estymowane koszty per generation (Gemini 3.1 Pro pricing: $2/M input, $12/M output):**
- Input: ~30k tokens (brand + KB + screenshoty) → $0.06
- Output: ~3k tokens (HTML) → $0.036
- **~$0.10 per initial generation**

### 6.4 Edycja AI ("zmień tło na niebieskie")

**Approach: Full HTML rewrite** (decyzja MVP — patrz Pytanie 7 dyskusji).

```
Input:
  - generationId
  - instruction: "zmień tło na niebieskie"

Pipeline:
  1. Załaduj generation.current_html
  2. Załaduj chat_messages dla generation (ostatnie 10 dla kontekstu)
  3. Prompt:
     - System: "Jesteś HTML editor. Otrzymujesz HTML grafiki i instrukcję zmiany.
       Zwróć CAŁY zmodyfikowany HTML. Zachowaj format, fonty, layout. Zmień TYLKO
       to, o co user prosi."
     - History: chat_messages
     - Current HTML: [attach as content]
     - User: instruction

  4. Stream response → SSE → live preview

  5. Po zakończeniu:
     a. UPDATE generations SET current_html=newHtml
     b. INSERT generation_versions (version_number=N+1, triggered_by='ai_edit', ai_prompt=instruction)
     c. INSERT chat_messages (user: instruction, assistant: krótkie potwierdzenie)
     d. Re-render PNG (async, nie blokuje SSE done event)
```

**Estymowane koszty per edit:** ~$0.05 (mniejszy input, mniejszy output)

### 6.5 Generowanie teł / elementów (Nano Banana Pro)

Trigger: opcja w UI generatora "Wygeneruj custom tło" lub LLM sam decyduje w trakcie (jeśli prompt sugeruje konkretne tło).

```
1. LLM (Gemini 3.1 Pro) podczas generowania HTML decyduje, czy potrzebuje
   custom obrazka (np. "person holding coffee, top-down, blue tint")
2. Wywołuje narzędzie (function calling) generate_background({ description, dimensions })
3. Backend: Nano Banana Pro API call → otrzymuje PNG
4. Save do ./storage/workspaces/{wid}/generated/{uuid}.png
5. Wstaw URL do HTML jako <img src="..."> lub background-image
6. Continue HTML generation z URL'em

Pricing Nano Banana Pro: ~$0.04/image (4K) — track w llm_usage
```

---

## 7. Plan wdrożenia (fazy)

### Faza 0: Foundations (Week 1)
**Cel:** Działający scaffold, jeden user się loguje, widzi pustą listę workspace'ów.

- [ ] Repo setup: Next.js 15 + TS + Tailwind + Drizzle + ESLint + Prettier
- [ ] Docker compose: `web` + `db` (Postgres + pgvector)
- [ ] Drizzle schema: wszystkie tabele z sekcji 4
- [ ] Migracje + seed (1 user, 1 demo workspace)
- [ ] Lucia Auth + middleware + login page
- [ ] Layout: navigation, workspace switcher
- [ ] CRUD workspace'ów (list, create, edit, delete)
- [ ] `lib/storage/` adapter (local FS implementation)
- [ ] `lib/ai/gemini.ts` — wrapper na SDK z token tracking
- [ ] `lib/renderer/playwright.ts` — singleton browser, simple `renderHtmlToPng()`
- [ ] `/api/health` endpoint

**Deliverable:** `docker compose up` → zaloguj się → utwórz workspace → renderowanie testowego HTML do PNG działa.

### Faza 1: Knowledge Base (Week 2)
**Cel:** User dodaje URL klienta i widzi screenshot + extracted content.

- [ ] KB sources CRUD (URL, upload, text)
- [ ] Playwright ingestion job (URL → screenshot + content)
- [ ] Background processing pattern (fire-and-forget z status tracking)
- [ ] UI: lista KB sources, status indicators, podgląd screenshotów
- [ ] "Auto-detect brand" — Gemini 3.1 Pro wyciąga colors/fonts/tone
- [ ] Brand settings UI (manual override)
- [ ] Logo upload

**Deliverable:** Wrzucam URL → po 10s widzę screenshot + auto-wyfilled brand colors.

### Faza 2: Generation MVP (Week 3-4)
**Cel:** Generuję pierwszą grafikę z briefa.

- [ ] `/api/generations` POST z SSE streaming
- [ ] Prompt template do generowania HTML (z brand + KB + format)
- [ ] Gemini 3.1 Pro integration — full pipeline
- [ ] Iframe live preview component
- [ ] Generation list per workspace
- [ ] PNG render + download
- [ ] Generation detail page (read-only HTML view + PNG preview)
- [ ] LLM usage tracking (`llm_usage` table)

**Deliverable:** Brief → 30s później mam wygenerowany HTML w iframe + PNG do pobrania.

### Faza 3: Editor (Week 5)
**Cel:** Edytor split-view działa: Monaco + iframe + AI chat.

- [ ] Monaco Editor integration (HTML syntax)
- [ ] Live iframe preview (debounced re-render on edit)
- [ ] Chat panel UI (messages, input, streaming responses)
- [ ] `/api/generations/[id]/edit` endpoint z SSE
- [ ] Generation versions: snapshot na każdą zmianę (manual + AI)
- [ ] Versions sidebar UI: lista + restore + diff (basic)
- [ ] PNG re-render trigger

**Deliverable:** Edytuję HTML ręcznie ALBO przez chat → live preview → wersjonowanie działa.

### Faza 4: Templates + Nano Banana (Week 6)
**Cel:** Promote do templatu + AI generuje tła.

- [ ] "Promote to template" + "Use template" workflow
- [ ] Templates gallery UI (per workspace)
- [ ] `parent_generation_id` tracking
- [ ] Nano Banana Pro integration (function calling z poziomu Gemini 3.1 Pro)
- [ ] UI: "Generate background" button w editor
- [ ] Image asset library (per workspace, generated images)

**Deliverable:** Zapisuję grafikę jako template → tworzę nową z templatu → AI dorzuca custom tło.

### Faza 5: Polish + Open Source Release (Week 7)
**Cel:** Internal użycie + GitHub release.

- [ ] Error handling + retry logic (LLM rate limits, Playwright timeouts)
- [ ] Onboarding flow (pierwszy login → wizard: utwórz workspace → dodaj URL → wygeneruj 1 grafikę)
- [ ] README + docs (self-hosting guide)
- [ ] `.env.example` z dokumentacją wszystkich zmiennych
- [ ] Prebuilt docker image na GHCR
- [ ] GitHub Actions: lint + typecheck + build
- [ ] LICENSE (MIT)
- [ ] Demo video / screenshots
- [ ] Public repo release

**Deliverable:** GitHub repo, ktoś z internetu może `git clone` + `docker compose up` i uruchomić.

### Out of MVP (v2+)
- Multi-format generation z jednego HTML (responsive layout)
- Tool-based AI editing (zamiast full HTML rewrite)
- WYSIWYG element editor
- RAG embeddings dla dużych KB
- Multi-tenancy + billing (SaaS layer)
- Bezpośrednia publikacja na FB/IG (Meta API)
- A/B testing kreacji
- Brand kit import (Figma plugin)
- Animowane grafiki / video (MP4 output)

---

## 8. Ryzyka i mitygacje

| # | Ryzyko | Prawdopodobieństwo | Impact | Mitygacja |
|---|--------|--------------------|--------|-----------|
| R1 | Gemini 3.1 Pro generuje brzydki / niespójny HTML — widoki pomięte, fonty się ładują z opóźnieniem | Wysokie | Wysoki | (a) Few-shot examples w system promptcie (3-5 ręcznie zrobionych "gold" grafik); (b) Lockdown CSS reset w wrapper template; (c) Inline SVG dla emoji/icons zamiast Unicode; (d) Eval set 20 briefów + manual review co tydzień |
| R2 | Playwright w docker = duża pamięć, OOM przy concurrent | Średnie | Średni | (a) Singleton browser z context pool (max 3); (b) Memory limit w docker-compose; (c) `--disable-dev-shm-usage` flag; (d) Playwright auto-restart co N renderów |
| R3 | Koszty Gemini wybuchną przy intensywnym użyciu | Średnie | Średni | (a) `llm_usage` tracking od dnia 1; (b) Hard cap per workspace per dzień (config w `.env`); (c) Per-operation timeouts; (d) Cache bran extraction (raz na zmianę KB) |
| R4 | User-uploaded HTML/scripts — XSS w iframe preview | Wysokie | Wysoki | (a) Iframe `sandbox="allow-same-origin"` (BEZ `allow-scripts`); (b) DOMPurify sanitization przed save; (c) CSP header z `script-src 'none'` w iframe response; (d) Playwright render w izolowanym contextcie |
| R5 | Gemini API rate limits / outage | Średnie | Wysoki | (a) Retry z exponential backoff; (b) Fallback na Gemini 3.1 Flash przy 429; (c) Queue na backend side; (d) Status page widget w UI |
| R6 | Self-hostery dostają nieaktualne API keys / wygasłe tokens | Niskie | Średni | (a) `/api/health` sprawdza Gemini connectivity; (b) Setup wizard waliduje keys przy pierwszym uruchomieniu; (c) Clear error messages w UI |
| R7 | "AI agent edycyjny" psuje HTML przy każdej edycji — drift, regression | Wysokie | Wysoki | (a) Snapshot przed każdą edycją (history table); (b) "Revert" buttom prominentnie; (c) Diff view między wersjami; (d) Po N edycjach (~10) prompt'uj usera "może warto zacząć od nowa?" |
| R8 | Brak governance dla open source contributors | Niskie | Niskie | (a) CODE_OF_CONDUCT.md; (b) PR template; (c) Clear MAINTAINERS.md |
| R9 | "Open source first, SaaS later" — ktoś forkuje Bannerwright i robi konkurencyjny SaaS | Niskie | Średni | (a) MIT license świadomy wybór; (b) SaaS wygrywa na hostingu/UX/support, nie na kodzie; (c) Build community wokół main repo |
| R10 | Custom fonty (user upload) — license violations | Niskie | Wysoki | (a) MVP: tylko Google Fonts; (b) v2: warning + checkbox "potwierdzam, że mam licencję" przy upload custom font |

---

## 9. Metryki sukcesu

### MVP (Internal use — Faza 1, 8 tygodni od kickoffu)
**Aktywacja:**
- ✅ Dawid + Bluebee używają tool'a do produkcji ≥ 50% grafik na social media w ciągu 30 dni od deploymentu

**Jakość outputu:**
- ✅ ≥ 70% wygenerowanych grafik akceptowalnych "as is" lub po ≤ 3 edycjach AI
- ✅ Średni czas: brief → finalna grafika (PNG) ≤ 5 minut
- ✅ Średnia liczba edycji per grafika ≤ 4

**Stabilność:**
- ✅ < 5% generations kończy się błędem (LLM, Playwright, etc.)
- ✅ p95 latency dla "edit" endpoint ≤ 10s
- ✅ Zero data loss incidents (history snapshots działają)

**Koszty:**
- ✅ Średni koszt per finalna grafika ≤ $0.40 (initial gen + 3 edits + 1 image gen)

### Open Source release (Faza 5, 16 tygodni)
- ✅ ≥ 100 GitHub stars w ciągu 2 tygodni od release
- ✅ ≥ 5 self-hosted deployments potwierdzonych (analytics opt-in lub feedback)
- ✅ ≥ 10 issues / PRs od community

### SaaS layer (v2, future)
- ✅ ≥ 50 paid signups w pierwszym kwartale po release SaaS
- ✅ MRR ≥ $500
- ✅ Churn < 10%/miesiąc
- ✅ NPS ≥ 30

---

## 10. Decyzje świadomie pominięte

Lista rzeczy, które ROZWAŻALIŚMY i ŚWIADOMIE odrzuciliśmy w MVP — bo wracają jako pytania:

| Decyzja | Co zamiast | Powód |
|---------|------------|-------|
| Multi-tenancy / multi-user | Single user per instance | Zero nadmiaru w open source; SaaS to osobna warstwa |
| Supabase / Clerk / NextAuth | Lucia Auth + Postgres | Self-hosted = zero vendor lock |
| BullMQ / Redis dla jobs | Fire-and-forget Promises | Single user, niska concurrency, premature complexity |
| RAG embeddings | 1M context Gemini 3.1 Pro | YAGNI; pgvector ready dla późniejszej aktywacji |
| Tool calling w edycji AI | Full HTML rewrite | Szybsze do MVP; tool API to v2 feature |
| WYSIWYG editor | Monaco + iframe | Power user target; WYSIWYG = 2 miesiące pracy |
| S3 / R2 storage | Local filesystem | Self-hosted simplicity; adapter dla SaaS |
| Multi-format z jednego HTML | Format = property generation | LLM ledwo radzi z 1 formatem; v2 |
| Custom fonts upload | Tylko Google Fonts | Licensing complexity; v2 z disclaimer |
| Direct publish na social media | Tylko PNG download | OAuth każdej platformy = osobny projekt |

---

## 11. Open questions (do rozstrzygnięcia w trakcie)

1. **Polski czy angielski jako język domyślny UI?** — Skoro target to PL freelancerzy (SaaS) ALE open source idzie globally, sugeruję EN default + i18n ready (next-intl) z PL jako pierwszym tłumaczeniem.
2. **Streaming HTML do iframe — debouncing strategy.** Re-render iframe na każdy chunk czy co 500ms? Sensible default: re-render jeśli ostatni chunk >200ms temu LUB completion.
3. **Versions retention.** Trzymamy WSZYSTKIE wersje wiecznie czy keep-last-N (np. 50)? MVP: wszystkie. v2: cleanup job.
4. **PNG storage size.** 1080x1080 PNG to ~1-2MB. Per workspace 100 grafik × 5 wersji = 500MB-1GB. Akceptowalne w MVP, w v2 thumbnaile + lazy full-size.

---

**Koniec PRD.**
