# syntax=docker/dockerfile:1.7

# ============================================================================
# Stage 1 — install deps with corepack pnpm
# ============================================================================
FROM node:22-bookworm-slim AS deps
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --prod=false

# ============================================================================
# Stage 2 — build Next.js
# ============================================================================
FROM node:22-bookworm-slim AS builder
WORKDIR /app
RUN corepack enable
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# DATABASE_URL etc. are validated at runtime, not build time.
ENV SKIP_ENV_VALIDATION=1
RUN pnpm build

# ============================================================================
# Stage 3 — runtime: Next + Playwright (chromium)
# ============================================================================
FROM mcr.microsoft.com/playwright:v1.59.1-noble AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN corepack enable

# Copy production deps + built app
COPY --from=builder /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/src/lib/db/migrations ./src/lib/db/migrations
COPY --from=builder /app/src/lib/db/migrate.ts ./src/lib/db/migrate.ts
COPY --from=builder /app/src/lib/db/seed.ts ./src/lib/db/seed.ts
COPY --from=builder /app/src/lib/db/schema.ts ./src/lib/db/schema.ts
COPY --from=builder /app/src/lib/db/client.ts ./src/lib/db/client.ts
COPY --from=builder /app/src/lib/env.ts ./src/lib/env.ts
COPY --from=builder /app/drizzle.config.ts ./drizzle.config.ts
COPY --from=builder /app/next.config.ts ./next.config.ts
COPY --from=builder /app/tsconfig.json ./tsconfig.json

RUN mkdir -p /app/storage && chown -R pwuser:pwuser /app
USER pwuser

EXPOSE 3000
CMD ["pnpm", "start"]
