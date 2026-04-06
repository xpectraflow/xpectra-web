ALTER TABLE "datasets" ADD COLUMN "telemetry_ingest_key" text;--> statement-breakpoint
ALTER TABLE "experiments" ADD COLUMN "hypertable_name" varchar(128);--> statement-breakpoint
UPDATE "experiments" SET "hypertable_name" = 'hyper-' || "id"::text WHERE "hypertable_name" IS NULL;--> statement-breakpoint
ALTER TABLE "experiments" ALTER COLUMN "hypertable_name" SET NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "experiments_hypertable_name_key" ON "experiments" USING btree ("hypertable_name");