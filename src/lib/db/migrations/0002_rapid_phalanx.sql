CREATE TABLE "waitlist_signups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"name" text,
	"use_case" text,
	"source" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"contacted_at" timestamp with time zone,
	CONSTRAINT "waitlist_signups_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE INDEX "idx_waitlist_status_created" ON "waitlist_signups" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "idx_waitlist_created" ON "waitlist_signups" USING btree ("created_at");