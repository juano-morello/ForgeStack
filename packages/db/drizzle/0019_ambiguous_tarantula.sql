CREATE TABLE "ai_usage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"user_id" text,
	"provider" text NOT NULL,
	"model" text NOT NULL,
	"input_tokens" integer DEFAULT 0 NOT NULL,
	"output_tokens" integer DEFAULT 0 NOT NULL,
	"estimated_cost" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ai_usage" ADD CONSTRAINT "ai_usage_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_usage" ADD CONSTRAINT "ai_usage_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_ai_usage_org_id" ON "ai_usage" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "idx_ai_usage_created_at" ON "ai_usage" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_ai_usage_org_date" ON "ai_usage" USING btree ("org_id","created_at");--> statement-breakpoint

-- Enable RLS on ai_usage table
ALTER TABLE "ai_usage" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "ai_usage" FORCE ROW LEVEL SECURITY;--> statement-breakpoint

-- RLS Policy: SELECT - users can view their org's AI usage
CREATE POLICY "ai_usage_select_policy" ON "ai_usage"
  FOR SELECT
  USING (
    org_id::text = current_setting('app.current_org_id', true)
  );--> statement-breakpoint

-- RLS Policy: INSERT - allow inserts for org context (service will handle this)
CREATE POLICY "ai_usage_insert_policy" ON "ai_usage"
  FOR INSERT
  WITH CHECK (
    org_id::text = current_setting('app.current_org_id', true)
    OR current_setting('app.bypass_rls', true) = 'true'
  );--> statement-breakpoint

-- RLS Policy: Bypass for service context
CREATE POLICY "ai_usage_bypass_policy" ON "ai_usage"
  USING (current_setting('app.bypass_rls', true) = 'true');