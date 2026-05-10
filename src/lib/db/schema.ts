import { sql } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  vector,
  type AnyPgColumn,
} from 'drizzle-orm/pg-core';

// ============================================================================
// AUTH (single-user; schema ready for multi-tenancy in future SaaS layer)
// ============================================================================
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const sessions = pgTable(
  'sessions',
  {
    id: text('id').primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  },
  (t) => [index('idx_sessions_user_id').on(t.userId)],
);

// ============================================================================
// WORKSPACES (one brand client per workspace)
// ============================================================================
export type BrandColors = {
  primary?: string;
  secondary?: string;
  accent?: string;
  background?: string;
  text?: string;
};

export type BrandFonts = {
  headline?: string;
  body?: string;
};

export const workspaces = pgTable(
  'workspaces',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    slug: text('slug').notNull(),
    description: text('description'),
    brandColors: jsonb('brand_colors').$type<BrandColors>(),
    brandFonts: jsonb('brand_fonts').$type<BrandFonts>(),
    logoUrl: text('logo_url'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('uniq_workspaces_user_slug').on(t.userId, t.slug),
    index('idx_workspaces_user_id').on(t.userId),
  ],
);

// ============================================================================
// KNOWLEDGE BASE (per workspace)
// ============================================================================
export type KbSourceType = 'url' | 'upload' | 'text';
export type KbSourceStatus = 'pending' | 'processing' | 'ready' | 'failed';

export type KbMetadata = {
  favicon?: string;
  title?: string;
  ogImage?: string;
  description?: string;
};

export const kbSources = pgTable(
  'kb_sources',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    sourceType: text('source_type').notNull().$type<KbSourceType>(),
    title: text('title').notNull(),
    url: text('url'),
    filePath: text('file_path'),
    contentText: text('content_text'),
    screenshotPath: text('screenshot_path'),
    metadata: jsonb('metadata').$type<KbMetadata>(),
    status: text('status').notNull().default('pending').$type<KbSourceStatus>(),
    errorMessage: text('error_message'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    processedAt: timestamp('processed_at', { withTimezone: true }),
  },
  (t) => [
    index('idx_kb_sources_workspace_id').on(t.workspaceId),
    index('idx_kb_sources_status').on(t.status),
  ],
);

// RAG-ready (schema only; no chunking/retrieval until milestone explicitly enabled)
export const kbEmbeddings = pgTable(
  'kb_embeddings',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    sourceId: uuid('source_id')
      .notNull()
      .references(() => kbSources.id, { onDelete: 'cascade' }),
    chunkText: text('chunk_text').notNull(),
    chunkIndex: integer('chunk_index').notNull(),
    embedding: vector('embedding', { dimensions: 768 }), // text-embedding-004
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('idx_kb_embeddings_source_id').on(t.sourceId)],
);

// ============================================================================
// GENERATIONS (banners)
// ============================================================================
export type GenerationFormat =
  | 'square_1080'
  | 'story_1080_1920'
  | 'landscape_1200_628'
  | 'portrait_1200_1500';

export const generations = pgTable(
  'generations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    parentGenerationId: uuid('parent_generation_id').references(
      (): AnyPgColumn => generations.id,
      { onDelete: 'set null' },
    ),
    title: text('title').notNull(),
    format: text('format').notNull().$type<GenerationFormat>(),
    currentHtml: text('current_html').notNull(),
    currentPngPath: text('current_png_path'),
    brief: text('brief'),
    isTemplate: boolean('is_template').notNull().default(false),
    templateName: text('template_name'),
    thumbnailPath: text('thumbnail_path'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('idx_generations_workspace_id').on(t.workspaceId),
    index('idx_generations_is_template')
      .on(t.workspaceId, t.isTemplate)
      .where(sql`${t.isTemplate} = true`),
    index('idx_generations_parent')
      .on(t.parentGenerationId)
      .where(sql`${t.parentGenerationId} IS NOT NULL`),
  ],
);

// ============================================================================
// GENERATION VERSIONS (history snapshots)
// ============================================================================
export type VersionTrigger = 'initial_generation' | 'manual_edit' | 'ai_edit' | 'restore';

export const generationVersions = pgTable(
  'generation_versions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    generationId: uuid('generation_id')
      .notNull()
      .references(() => generations.id, { onDelete: 'cascade' }),
    versionNumber: integer('version_number').notNull(),
    html: text('html').notNull(),
    triggeredBy: text('triggered_by').notNull().$type<VersionTrigger>(),
    aiPrompt: text('ai_prompt'),
    pngPath: text('png_path'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('uniq_versions_generation_version').on(t.generationId, t.versionNumber),
    index('idx_versions_generation_id').on(t.generationId, t.versionNumber),
  ],
);

// ============================================================================
// CHAT MESSAGES (per generation)
// ============================================================================
export type ChatRole = 'user' | 'assistant' | 'system';

export const chatMessages = pgTable(
  'chat_messages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    generationId: uuid('generation_id')
      .notNull()
      .references(() => generations.id, { onDelete: 'cascade' }),
    role: text('role').notNull().$type<ChatRole>(),
    content: text('content').notNull(),
    resultedInVersionId: uuid('resulted_in_version_id').references(
      () => generationVersions.id,
      { onDelete: 'set null' },
    ),
    tokensUsed: integer('tokens_used'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('idx_chat_messages_generation_id').on(t.generationId, t.createdAt)],
);

// ============================================================================
// LLM USAGE (cost tracking per call)
// ============================================================================
export type LlmOperation =
  | 'generate_html'
  | 'edit_html'
  | 'extract_brand'
  | 'image_gen'
  | 'summarise'
  | 'other';

export const llmUsage = pgTable(
  'llm_usage',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    workspaceId: uuid('workspace_id').references(() => workspaces.id, {
      onDelete: 'set null',
    }),
    generationId: uuid('generation_id').references(() => generations.id, {
      onDelete: 'set null',
    }),
    model: text('model').notNull(),
    operation: text('operation').notNull().$type<LlmOperation>(),
    inputTokens: integer('input_tokens').notNull().default(0),
    outputTokens: integer('output_tokens').notNull().default(0),
    costUsd: numeric('cost_usd', { precision: 10, scale: 6 }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('idx_llm_usage_workspace_created').on(t.workspaceId, t.createdAt),
    index('idx_llm_usage_created').on(t.createdAt),
  ],
);

// ============================================================================
// Type exports
// ============================================================================
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type Workspace = typeof workspaces.$inferSelect;
export type NewWorkspace = typeof workspaces.$inferInsert;
export type KbSource = typeof kbSources.$inferSelect;
export type Generation = typeof generations.$inferSelect;
export type NewGeneration = typeof generations.$inferInsert;
export type GenerationVersion = typeof generationVersions.$inferSelect;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type LlmUsageRow = typeof llmUsage.$inferSelect;
export type NewLlmUsage = typeof llmUsage.$inferInsert;
