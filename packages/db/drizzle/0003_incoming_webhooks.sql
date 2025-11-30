CREATE TABLE "incoming_webhook_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid,
	"provider" text NOT NULL,
	"event_type" text NOT NULL,
	"event_id" text NOT NULL,
	"payload" jsonb NOT NULL,
	"signature" text,
	"verified" boolean DEFAULT false NOT NULL,
	"processed_at" timestamp with time zone,
	"error" text,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_incoming_webhook_provider_event" UNIQUE("provider","event_id")
);
--> statement-breakpoint
ALTER TABLE "incoming_webhook_events" ADD CONSTRAINT "incoming_webhook_events_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_incoming_webhook_provider" ON "incoming_webhook_events" USING btree ("provider");--> statement-breakpoint
CREATE INDEX "idx_incoming_webhook_event_type" ON "incoming_webhook_events" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "idx_incoming_webhook_processed" ON "incoming_webhook_events" USING btree ("processed_at");--> statement-breakpoint
CREATE INDEX "idx_incoming_webhook_org_id" ON "incoming_webhook_events" USING btree ("org_id");