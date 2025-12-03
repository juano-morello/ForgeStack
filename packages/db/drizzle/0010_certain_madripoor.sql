CREATE TABLE "member_roles" (
	"org_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"role_id" uuid NOT NULL,
	"assigned_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "member_roles_org_id_user_id_role_id_pk" PRIMARY KEY("org_id","user_id","role_id")
);
--> statement-breakpoint
CREATE TABLE "permissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"resource" text NOT NULL,
	"action" text NOT NULL,
	CONSTRAINT "permissions_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "platform_audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_id" text,
	"actor_email" text NOT NULL,
	"action" text NOT NULL,
	"resource_type" text NOT NULL,
	"resource_id" text,
	"resource_name" text,
	"target_org_id" uuid,
	"target_org_name" text,
	"changes" jsonb,
	"metadata" jsonb,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "role_permissions" (
	"role_id" uuid NOT NULL,
	"permission_id" uuid NOT NULL,
	CONSTRAINT "role_permissions_role_id_permission_id_pk" PRIMARY KEY("role_id","permission_id")
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid,
	"name" text NOT NULL,
	"description" text,
	"is_system" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "suspended_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "suspended_reason" text;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "suspended_by" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "is_super_admin" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "suspended_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "suspended_reason" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "suspended_by" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "last_login_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "member_roles" ADD CONSTRAINT "member_roles_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_roles" ADD CONSTRAINT "member_roles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_roles" ADD CONSTRAINT "member_roles_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_audit_logs" ADD CONSTRAINT "platform_audit_logs_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_audit_logs" ADD CONSTRAINT "platform_audit_logs_target_org_id_organizations_id_fk" FOREIGN KEY ("target_org_id") REFERENCES "public"."organizations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_permissions_id_fk" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "roles" ADD CONSTRAINT "roles_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_member_roles_user_id" ON "member_roles" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_member_roles_role_id" ON "member_roles" USING btree ("role_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_permissions_resource_action" ON "permissions" USING btree ("resource","action");--> statement-breakpoint
CREATE INDEX "idx_platform_audit_logs_actor_id" ON "platform_audit_logs" USING btree ("actor_id");--> statement-breakpoint
CREATE INDEX "idx_platform_audit_logs_action" ON "platform_audit_logs" USING btree ("action");--> statement-breakpoint
CREATE INDEX "idx_platform_audit_logs_resource_type" ON "platform_audit_logs" USING btree ("resource_type");--> statement-breakpoint
CREATE INDEX "idx_platform_audit_logs_target_org_id" ON "platform_audit_logs" USING btree ("target_org_id");--> statement-breakpoint
CREATE INDEX "idx_platform_audit_logs_created_at" ON "platform_audit_logs" USING btree ("created_at");--> statement-breakpoint
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_suspended_by_users_id_fk" FOREIGN KEY ("suspended_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;