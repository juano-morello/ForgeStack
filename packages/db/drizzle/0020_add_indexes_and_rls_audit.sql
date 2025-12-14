-- Add missing indexes
CREATE INDEX IF NOT EXISTS idx_projects_org_id ON projects (org_id);
CREATE INDEX IF NOT EXISTS idx_projects_org_created ON projects (org_id, created_at);
CREATE INDEX IF NOT EXISTS idx_invitations_org_id ON invitations (org_id);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON invitations (email);
CREATE INDEX IF NOT EXISTS idx_invitations_token ON invitations (token);
CREATE INDEX IF NOT EXISTS idx_invitations_expires_at ON invitations (expires_at);
CREATE INDEX IF NOT EXISTS idx_subscriptions_customer_id ON subscriptions (customer_id);

-- Create RLS bypass audit table
CREATE TABLE IF NOT EXISTS rls_bypass_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  operation TEXT NOT NULL,
  reason TEXT,
  user_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index on rls_bypass_audit for querying
CREATE INDEX IF NOT EXISTS idx_rls_bypass_audit_created ON rls_bypass_audit (created_at);
CREATE INDEX IF NOT EXISTS idx_rls_bypass_audit_table ON rls_bypass_audit (table_name);

