-- Add missing suspended columns to organizations table
-- These columns were defined in the schema but missing from the database

ALTER TABLE organizations ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS suspended_reason TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS suspended_by TEXT REFERENCES users(id);

