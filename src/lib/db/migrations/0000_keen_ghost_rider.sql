CREATE TABLE "chat_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"generation_id" uuid NOT NULL,
	"role" text NOT NULL,
	"content" text NOT NULL,
	"resulted_in_version_id" uuid,
	"tokens_used" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "generation_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"generation_id" uuid NOT NULL,
	"version_number" integer NOT NULL,
	"html" text NOT NULL,
	"triggered_by" text NOT NULL,
	"ai_prompt" text,
	"png_path" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "generations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"parent_generation_id" uuid,
	"title" text NOT NULL,
	"format" text NOT NULL,
	"current_html" text NOT NULL,
	"current_png_path" text,
	"brief" text,
	"is_template" boolean DEFAULT false NOT NULL,
	"template_name" text,
	"thumbnail_path" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kb_embeddings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_id" uuid NOT NULL,
	"chunk_text" text NOT NULL,
	"chunk_index" integer NOT NULL,
	"embedding" vector(768),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kb_sources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"source_type" text NOT NULL,
	"title" text NOT NULL,
	"url" text,
	"file_path" text,
	"content_text" text,
	"screenshot_path" text,
	"metadata" jsonb,
	"status" text DEFAULT 'pending' NOT NULL,
	"error_message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"processed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "llm_usage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid,
	"generation_id" uuid,
	"model" text NOT NULL,
	"operation" text NOT NULL,
	"input_tokens" integer DEFAULT 0 NOT NULL,
	"output_tokens" integer DEFAULT 0 NOT NULL,
	"cost_usd" numeric(10, 6),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "workspaces" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"brand_colors" jsonb,
	"brand_fonts" jsonb,
	"logo_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_generation_id_generations_id_fk" FOREIGN KEY ("generation_id") REFERENCES "public"."generations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_resulted_in_version_id_generation_versions_id_fk" FOREIGN KEY ("resulted_in_version_id") REFERENCES "public"."generation_versions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "generation_versions" ADD CONSTRAINT "generation_versions_generation_id_generations_id_fk" FOREIGN KEY ("generation_id") REFERENCES "public"."generations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "generations" ADD CONSTRAINT "generations_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "generations" ADD CONSTRAINT "generations_parent_generation_id_generations_id_fk" FOREIGN KEY ("parent_generation_id") REFERENCES "public"."generations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kb_embeddings" ADD CONSTRAINT "kb_embeddings_source_id_kb_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."kb_sources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kb_sources" ADD CONSTRAINT "kb_sources_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "llm_usage" ADD CONSTRAINT "llm_usage_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "llm_usage" ADD CONSTRAINT "llm_usage_generation_id_generations_id_fk" FOREIGN KEY ("generation_id") REFERENCES "public"."generations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_chat_messages_generation_id" ON "chat_messages" USING btree ("generation_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_versions_generation_version" ON "generation_versions" USING btree ("generation_id","version_number");--> statement-breakpoint
CREATE INDEX "idx_versions_generation_id" ON "generation_versions" USING btree ("generation_id","version_number");--> statement-breakpoint
CREATE INDEX "idx_generations_workspace_id" ON "generations" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "idx_generations_is_template" ON "generations" USING btree ("workspace_id","is_template") WHERE "generations"."is_template" = true;--> statement-breakpoint
CREATE INDEX "idx_generations_parent" ON "generations" USING btree ("parent_generation_id") WHERE "generations"."parent_generation_id" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_kb_embeddings_source_id" ON "kb_embeddings" USING btree ("source_id");--> statement-breakpoint
CREATE INDEX "idx_kb_sources_workspace_id" ON "kb_sources" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "idx_kb_sources_status" ON "kb_sources" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_llm_usage_workspace_created" ON "llm_usage" USING btree ("workspace_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_llm_usage_created" ON "llm_usage" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_sessions_user_id" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_workspaces_user_slug" ON "workspaces" USING btree ("user_id","slug");--> statement-breakpoint
CREATE INDEX "idx_workspaces_user_id" ON "workspaces" USING btree ("user_id");