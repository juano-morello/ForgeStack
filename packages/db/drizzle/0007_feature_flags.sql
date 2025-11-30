CREATE TABLE "feature_flags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"type" text DEFAULT 'boolean' NOT NULL,
	"default_value" boolean DEFAULT false NOT NULL,
	"plans" text[],
	"percentage" integer DEFAULT 0,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "feature_flags_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "organization_feature_overrides" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"flag_id" uuid NOT NULL,
	"enabled" boolean NOT NULL,
	"reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_org_feature_override" UNIQUE("org_id","flag_id")
);
--> statement-breakpoint
ALTER TABLE "organization_feature_overrides" ADD CONSTRAINT "organization_feature_overrides_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_feature_overrides" ADD CONSTRAINT "organization_feature_overrides_flag_id_feature_flags_id_fk" FOREIGN KEY ("flag_id") REFERENCES "public"."feature_flags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_feature_flags_key" ON "feature_flags" USING btree ("key");--> statement-breakpoint
CREATE INDEX "idx_feature_flags_enabled" ON "feature_flags" USING btree ("enabled");--> statement-breakpoint
CREATE INDEX "idx_feature_overrides_org_id" ON "organization_feature_overrides" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "idx_feature_overrides_flag_id" ON "organization_feature_overrides" USING btree ("flag_id");