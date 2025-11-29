-- Enable Row Level Security on org-scoped tables
-- Note: user_id is now TEXT (better-auth format) instead of UUID

-- Enable RLS on organizations
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations FORCE ROW LEVEL SECURITY;

-- Enable RLS on organization_members
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members FORCE ROW LEVEL SECURITY;

-- Enable RLS on projects
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects FORCE ROW LEVEL SECURITY;

-- Enable RLS on invitations
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations FORCE ROW LEVEL SECURITY;

-- =====================================================
-- Organizations Policies
-- =====================================================

-- SELECT: Users can see orgs where they are members
CREATE POLICY organizations_select_policy ON organizations
  FOR SELECT
  USING (
    id IN (
      SELECT org_id FROM organization_members
      WHERE user_id = current_setting('app.current_user_id', true)
    )
    OR current_setting('app.bypass_rls', true) = 'true'
  );

-- INSERT: Any authenticated user can create an org
CREATE POLICY organizations_insert_policy ON organizations
  FOR INSERT
  WITH CHECK (
    current_setting('app.current_user_id', true) IS NOT NULL
    OR current_setting('app.bypass_rls', true) = 'true'
  );

-- UPDATE: Only OWNER can update org details
CREATE POLICY organizations_update_policy ON organizations
  FOR UPDATE
  USING (
    (id::text = current_setting('app.current_org_id', true)
    AND current_setting('app.current_role', true) = 'OWNER')
    OR current_setting('app.bypass_rls', true) = 'true'
  );

-- DELETE: Only OWNER can delete org
CREATE POLICY organizations_delete_policy ON organizations
  FOR DELETE
  USING (
    (id::text = current_setting('app.current_org_id', true)
    AND current_setting('app.current_role', true) = 'OWNER')
    OR current_setting('app.bypass_rls', true) = 'true'
  );

-- =====================================================
-- Organization Members Policies
-- =====================================================

-- SELECT: Users can see members of their current org
CREATE POLICY organization_members_select_policy ON organization_members
  FOR SELECT
  USING (
    (org_id::text = current_setting('app.current_org_id', true))
    OR current_setting('app.bypass_rls', true) = 'true'
  );

-- INSERT: Only OWNER can add members (or bypass for initial setup)
CREATE POLICY organization_members_insert_policy ON organization_members
  FOR INSERT
  WITH CHECK (
    (org_id::text = current_setting('app.current_org_id', true)
    AND current_setting('app.current_role', true) = 'OWNER')
    OR current_setting('app.bypass_rls', true) = 'true'
  );

-- UPDATE: Only OWNER can update member roles
CREATE POLICY organization_members_update_policy ON organization_members
  FOR UPDATE
  USING (
    (org_id::text = current_setting('app.current_org_id', true)
    AND current_setting('app.current_role', true) = 'OWNER')
    OR current_setting('app.bypass_rls', true) = 'true'
  );

-- DELETE: Only OWNER can remove members
CREATE POLICY organization_members_delete_policy ON organization_members
  FOR DELETE
  USING (
    (org_id::text = current_setting('app.current_org_id', true)
    AND current_setting('app.current_role', true) = 'OWNER')
    OR current_setting('app.bypass_rls', true) = 'true'
  );

-- =====================================================
-- Projects Policies
-- =====================================================

-- SELECT: Users can see projects in their current org
CREATE POLICY projects_select_policy ON projects
  FOR SELECT
  USING (
    (org_id::text = current_setting('app.current_org_id', true))
    OR current_setting('app.bypass_rls', true) = 'true'
  );

-- INSERT: OWNER and MEMBER can create projects
CREATE POLICY projects_insert_policy ON projects
  FOR INSERT
  WITH CHECK (
    (org_id::text = current_setting('app.current_org_id', true)
    AND current_setting('app.current_role', true) IN ('OWNER', 'MEMBER'))
    OR current_setting('app.bypass_rls', true) = 'true'
  );

-- UPDATE: OWNER and MEMBER can update projects
CREATE POLICY projects_update_policy ON projects
  FOR UPDATE
  USING (
    (org_id::text = current_setting('app.current_org_id', true)
    AND current_setting('app.current_role', true) IN ('OWNER', 'MEMBER'))
    OR current_setting('app.bypass_rls', true) = 'true'
  );

-- DELETE: Only OWNER can delete projects
CREATE POLICY projects_delete_policy ON projects
  FOR DELETE
  USING (
    (org_id::text = current_setting('app.current_org_id', true)
    AND current_setting('app.current_role', true) = 'OWNER')
    OR current_setting('app.bypass_rls', true) = 'true'
  );

-- =====================================================
-- Invitations Policies
-- =====================================================

-- SELECT: Users can see invitations for their current org
CREATE POLICY invitations_select_policy ON invitations
  FOR SELECT
  USING (
    (org_id::text = current_setting('app.current_org_id', true))
    OR current_setting('app.bypass_rls', true) = 'true'
  );

-- INSERT: Only OWNER can create invitations
CREATE POLICY invitations_insert_policy ON invitations
  FOR INSERT
  WITH CHECK (
    (org_id::text = current_setting('app.current_org_id', true)
    AND current_setting('app.current_role', true) = 'OWNER')
    OR current_setting('app.bypass_rls', true) = 'true'
  );

-- UPDATE: Only OWNER can update invitations
CREATE POLICY invitations_update_policy ON invitations
  FOR UPDATE
  USING (
    (org_id::text = current_setting('app.current_org_id', true)
    AND current_setting('app.current_role', true) = 'OWNER')
    OR current_setting('app.bypass_rls', true) = 'true'
  );

-- DELETE: Only OWNER can delete invitations
CREATE POLICY invitations_delete_policy ON invitations
  FOR DELETE
  USING (
    (org_id::text = current_setting('app.current_org_id', true)
    AND current_setting('app.current_role', true) = 'OWNER')
    OR current_setting('app.bypass_rls', true) = 'true'
  );
