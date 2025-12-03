CREATE TABLE "plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"display_name" text NOT NULL,
	"description" text,
	"stripe_price_id_monthly" text,
	"stripe_price_id_yearly" text,
	"stripe_metered_price_id" text,
	"limits" jsonb DEFAULT '{}' NOT NULL,
	"price_monthly" bigint,
	"price_yearly" bigint,
	"features" jsonb DEFAULT '[]' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "plans_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "usage_limits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"metric_type" text NOT NULL,
	"limit_value" bigint NOT NULL,
	"is_hard_limit" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_usage_limits_org_metric" UNIQUE("org_id","metric_type")
);
--> statement-breakpoint
CREATE TABLE "usage_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"period_start" timestamp with time zone NOT NULL,
	"period_end" timestamp with time zone NOT NULL,
	"metric_type" text NOT NULL,
	"quantity" bigint DEFAULT 0 NOT NULL,
	"reported_to_stripe" boolean DEFAULT false,
	"stripe_usage_record_id" text,
	"reported_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_usage_records_org_period_metric" UNIQUE("org_id","period_start","metric_type")
);
--> statement-breakpoint
ALTER TABLE "usage_limits" ADD CONSTRAINT "usage_limits_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usage_records" ADD CONSTRAINT "usage_records_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_usage_limits_org_id" ON "usage_limits" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "idx_usage_records_org_id" ON "usage_records" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "idx_usage_records_period" ON "usage_records" USING btree ("period_start","period_end");--> statement-breakpoint
CREATE INDEX "idx_usage_records_metric_type" ON "usage_records" USING btree ("metric_type");