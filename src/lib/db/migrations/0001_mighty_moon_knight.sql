ALTER TABLE "generation_versions" ALTER COLUMN "html" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "generations" ALTER COLUMN "current_html" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "generation_versions" ADD COLUMN "tree" jsonb;--> statement-breakpoint
ALTER TABLE "generations" ADD COLUMN "current_tree" jsonb;