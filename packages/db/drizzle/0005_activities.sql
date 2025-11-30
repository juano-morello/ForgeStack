CREATE TABLE "activities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"actor_id" uuid,
	"actor_name" text,
	"actor_avatar" text,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"resource_type" text,
	"resource_id" text,
	"resource_name" text,
	"metadata" jsonb,
	"aggregation_key" text,
	"aggregation_count" integer DEFAULT 1,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_activities_org_id" ON "activities" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "idx_activities_actor_id" ON "activities" USING btree ("actor_id");--> statement-breakpoint
CREATE INDEX "idx_activities_type" ON "activities" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_activities_created_at" ON "activities" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_activities_aggregation_key" ON "activities" USING btree ("aggregation_key");--> statement-breakpoint
CREATE INDEX "idx_activities_org_created" ON "activities" USING btree ("org_id","created_at");