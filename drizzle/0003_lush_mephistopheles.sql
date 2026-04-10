CREATE TABLE "rules" (
	"id" uuid PRIMARY KEY NOT NULL,
	"organisation_id" uuid,
	"name" text NOT NULL,
	"description" text,
	"type" text DEFAULT 'THRESHOLD' NOT NULL,
	"config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"is_managed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "experiments" ADD COLUMN "rule_ids" uuid[] DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE "rules" ADD CONSTRAINT "rules_organisation_id_organizations_id_fk" FOREIGN KEY ("organisation_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;