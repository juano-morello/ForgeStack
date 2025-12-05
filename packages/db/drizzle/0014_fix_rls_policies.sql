-- Fix RLS policies to ensure bypass works correctly
-- Drop existing policies and recreate with proper bypass logic

-- First, ensure RLS is enabled on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations FORCE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members FORCE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects FORCE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations FORCE ROW LEVEL SECURITY;

-- Drop all existing organization policies
DROP POLICY IF EXISTS organizations_select_policy ON organizations;
DROP POLICY IF EXISTS organizations_insert_policy ON organizations;
DROP POLICY IF EXISTS organizations_update_policy ON organizations;
DROP POLICY IF EXISTS organizations_delete_policy ON organizations;
DROP POLICY IF EXISTS organizations_bypass_policy ON organizations;

-- Drop all existing organization_members policies
DROP POLICY IF EXISTS organization_members_select_policy ON organization_members;
DROP POLICY IF EXISTS organization_members_insert_policy ON organization_members;
DROP POLICY IF EXISTS organization_members_update_policy ON organization_members;
DROP POLICY IF EXISTS organization_members_delete_policy ON organization_members;
DROP POLICY IF EXISTS organization_members_bypass_policy ON organization_members;

-- Drop all existing projects policies
DROP POLICY IF EXISTS projects_select_policy ON projects;
DROP POLICY IF EXISTS projects_insert_policy ON projects;
DROP POLICY IF EXISTS projects_update_policy ON projects;
DROP POLICY IF EXISTS projects_delete_policy ON projects;
DROP POLICY IF EXISTS projects_bypass_policy ON projects;

-- Drop all existing invitations policies
DROP POLICY IF EXISTS invitations_select_policy ON invitations;
DROP POLICY IF EXISTS invitations_insert_policy ON invitations;
DROP POLICY IF EXISTS invitations_update_policy ON invitations;
DROP POLICY IF EXISTS invitations_delete_policy ON invitations;
DROP POLICY IF EXISTS invitations_bypass_policy ON invitations;

-- =====================================================
-- Organizations Policies (with bypass in each policy)
-- =====================================================

-- SELECT: Users can see orgs where they are members
CREATE POLICY organizations_select_policy ON organizations
  FOR SELECT
  USING (
    current_setting('app.bypass_rls', true) = 'true'
    OR id IN (
      SELECT org_id FROM organization_members
      WHERE user_id = current_setting('app.current_user_id', true)
    )
  );

-- INSERT: Any authenticated user can create an org (or bypass)
CREATE POLICY organizations_insert_policy ON organizations
  FOR INSERT
  WITH CHECK (
    current_setting('app.bypass_rls', true) = 'true'
    OR current_setting('app.current_user_id', true) IS NOT NULL
  );

-- UPDATE: Only OWNER can update org details (or bypass)
CREATE POLICY organizations_update_policy ON organizations
  FOR UPDATE
  USING (
    current_setting('app.bypass_rls', true) = 'true'
    OR (id::text = current_setting('app.current_org_id', true)
        AND current_setting('app.current_role', true) = 'OWNER')
  );

-- DELETE: Only OWNER can delete org (or bypass)
CREATE POLICY organizations_delete_policy ON organizations
  FOR DELETE
  USING (
    current_setting('app.bypass_rls', true) = 'true'
    OR (id::text = current_setting('app.current_org_id', true)
        AND current_setting('app.current_role', true) = 'OWNER')
  );

-- =====================================================
-- Organization Members Policies
-- =====================================================

-- SELECT: Users can see members of their current org
CREATE POLICY organization_members_select_policy ON organization_members
  FOR SELECT
  USING (
    current_setting('app.bypass_rls', true) = 'true'
    OR org_id::text = current_setting('app.current_org_id', true)
  );

-- INSERT: Only OWNER can add members (or bypass for initial setup)
CREATE POLICY organization_members_insert_policy ON organization_members
  FOR INSERT
  WITH CHECK (
    current_setting('app.bypass_rls', true) = 'true'
    OR (org_id::text = current_setting('app.current_org_id', true)
        AND current_setting('app.current_role', true) = 'OWNER')
  );

-- UPDATE: Only OWNER can update member roles
CREATE POLICY organization_members_update_policy ON organization_members
  FOR UPDATE
  USING (
    current_setting('app.bypass_rls', true) = 'true'
    OR (org_id::text = current_setting('app.current_org_id', true)
        AND current_setting('app.current_role', true) = 'OWNER')
  );

-- DELETE: Only OWNER can remove members
CREATE POLICY organization_members_delete_policy ON organization_members
  FOR DELETE
  USING (
    current_setting('app.bypass_rls', true) = 'true'
    OR (org_id::text = current_setting('app.current_org_id', true)
        AND current_setting('app.current_role', true) = 'OWNER')
  );

-- =====================================================
-- Projects Policies
-- =====================================================

-- SELECT: Users can see projects in their current org
CREATE POLICY projects_select_policy ON projects
  FOR SELECT
  USING (
    current_setting('app.bypass_rls', true) = 'true'
    OR org_id::text = current_setting('app.current_org_id', true)
  );

-- INSERT: OWNER and MEMBER can create projects
CREATE POLICY projects_insert_policy ON projects
  FOR INSERT
  WITH CHECK (
    current_setting('app.bypass_rls', true) = 'true'
    OR (org_id::text = current_setting('app.current_org_id', true)
        AND current_setting('app.current_role', true) IN ('OWNER', 'MEMBER'))
  );

-- UPDATE: OWNER and MEMBER can update projects
CREATE POLICY projects_update_policy ON projects
  FOR UPDATE
  USING (
    current_setting('app.bypass_rls', true) = 'true'
    OR (org_id::text = current_setting('app.current_org_id', true)
        AND current_setting('app.current_role', true) IN ('OWNER', 'MEMBER'))
  );

-- DELETE: Only OWNER can delete projects
CREATE POLICY projects_delete_policy ON projects
  FOR DELETE
  USING (
    current_setting('app.bypass_rls', true) = 'true'
    OR (org_id::text = current_setting('app.current_org_id', true)
        AND current_setting('app.current_role', true) = 'OWNER')
  );

-- =====================================================
-- Invitations Policies
-- =====================================================

-- SELECT: Users can see invitations for their current org
CREATE POLICY invitations_select_policy ON invitations
  FOR SELECT
  USING (
    current_setting('app.bypass_rls', true) = 'true'
    OR org_id::text = current_setting('app.current_org_id', true)
  );

-- INSERT: Only OWNER can create invitations
CREATE POLICY invitations_insert_policy ON invitations
  FOR INSERT
  WITH CHECK (
    current_setting('app.bypass_rls', true) = 'true'
    OR (org_id::text = current_setting('app.current_org_id', true)
        AND current_setting('app.current_role', true) = 'OWNER')
  );

-- UPDATE: Only OWNER can update invitations
CREATE POLICY invitations_update_policy ON invitations
  FOR UPDATE
  USING (
    current_setting('app.bypass_rls', true) = 'true'
    OR (org_id::text = current_setting('app.current_org_id', true)
        AND current_setting('app.current_role', true) = 'OWNER')
  );

-- DELETE: Only OWNER can delete invitations
CREATE POLICY invitations_delete_policy ON invitations
  FOR DELETE
  USING (
    current_setting('app.bypass_rls', true) = 'true'
    OR (org_id::text = current_setting('app.current_org_id', true)
        AND current_setting('app.current_role', true) = 'OWNER')
  );

