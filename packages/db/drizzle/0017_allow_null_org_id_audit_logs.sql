-- Allow null org_id in audit_logs for user-scoped events (like onboarding completion)
-- that happen outside of an organization context

ALTER TABLE audit_logs ALTER COLUMN org_id DROP NOT NULL;

