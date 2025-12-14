-- Rename token column to token_hash in impersonation_sessions table
ALTER TABLE "impersonation_sessions" RENAME COLUMN "token" TO "token_hash";--> statement-breakpoint

-- Drop old index on token column
DROP INDEX IF EXISTS "idx_impersonation_sessions_token";--> statement-breakpoint

-- Create new index on token_hash column
CREATE INDEX "idx_impersonation_sessions_token_hash" ON "impersonation_sessions" USING btree ("token_hash");

