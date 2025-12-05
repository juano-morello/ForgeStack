-- Enable RLS on org-scoped tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations FORCE ROW LEVEL SECURITY;

ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members FORCE ROW LEVEL SECURITY;

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects FORCE ROW LEVEL SECURITY;

ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations FORCE ROW LEVEL SECURITY;

-- Organizations policies
-- SELECT: User must be a member of the org
CREATE POLICY organizations_select_policy ON organizations
  FOR SELECT
  USING (
    id::text = current_setting('app.current_org_id', true)
    OR EXISTS (
      SELECT 1 FROM organization_members
      WHERE org_id = organizations.id
      AND user_id::text = current_setting('app.current_user_id', true)
    )
  );

-- INSERT: Any authenticated user can create org
CREATE POLICY organizations_insert_policy ON organizations
  FOR INSERT
  WITH CHECK (
    current_setting('app.current_user_id', true) IS NOT NULL
    AND current_setting('app.current_user_id', true) != ''
  );

-- UPDATE: Only owner can update
CREATE POLICY organizations_update_policy ON organizations
  FOR UPDATE
  USING (
    id::text = current_setting('app.current_org_id', true)
    AND current_setting('app.current_role', true) = 'OWNER'
  );

-- DELETE: Only owner can delete
CREATE POLICY organizations_delete_policy ON organizations
  FOR DELETE
  USING (
    id::text = current_setting('app.current_org_id', true)
    AND current_setting('app.current_role', true) = 'OWNER'
  );

-- Organization Members policies
-- SELECT: User must be member of same org
CREATE POLICY organization_members_select_policy ON organization_members
  FOR SELECT
  USING (
    org_id::text = current_setting('app.current_org_id', true)
  );

-- INSERT: Only owner can add members
CREATE POLICY organization_members_insert_policy ON organization_members
  FOR INSERT
  WITH CHECK (
    org_id::text = current_setting('app.current_org_id', true)
    AND current_setting('app.current_role', true) = 'OWNER'
  );

-- UPDATE: Only owner can update roles
CREATE POLICY organization_members_update_policy ON organization_members
  FOR UPDATE
  USING (
    org_id::text = current_setting('app.current_org_id', true)
    AND current_setting('app.current_role', true) = 'OWNER'
  );

-- DELETE: Only owner can remove members
CREATE POLICY organization_members_delete_policy ON organization_members
  FOR DELETE
  USING (
    org_id::text = current_setting('app.current_org_id', true)
    AND current_setting('app.current_role', true) = 'OWNER'
  );

-- Projects policies
-- SELECT: User must be member of project's org
CREATE POLICY projects_select_policy ON projects
  FOR SELECT
  USING (
    org_id::text = current_setting('app.current_org_id', true)
  );

-- INSERT: Any org member can create projects
CREATE POLICY projects_insert_policy ON projects
  FOR INSERT
  WITH CHECK (
    org_id::text = current_setting('app.current_org_id', true)
  );

-- UPDATE: Any org member can update projects
CREATE POLICY projects_update_policy ON projects
  FOR UPDATE
  USING (
    org_id::text = current_setting('app.current_org_id', true)
  );

-- DELETE: Only owner can delete projects
CREATE POLICY projects_delete_policy ON projects
  FOR DELETE
  USING (
    org_id::text = current_setting('app.current_org_id', true)
    AND current_setting('app.current_role', true) = 'OWNER'
  );

-- Invitations policies
-- SELECT: Owner can view invitations
CREATE POLICY invitations_select_policy ON invitations
  FOR SELECT
  USING (
    org_id::text = current_setting('app.current_org_id', true)
    AND current_setting('app.current_role', true) = 'OWNER'
  );

-- INSERT: Only owner can create invitations
CREATE POLICY invitations_insert_policy ON invitations
  FOR INSERT
  WITH CHECK (
    org_id::text = current_setting('app.current_org_id', true)
    AND current_setting('app.current_role', true) = 'OWNER'
  );

-- DELETE: Only owner can delete invitations
CREATE POLICY invitations_delete_policy ON invitations
  FOR DELETE
  USING (
    org_id::text = current_setting('app.current_org_id', true)
    AND current_setting('app.current_role', true) = 'OWNER'
  );

-- Bypass policy for service accounts (when app.bypass_rls = 'true')
-- This should only be used by trusted service contexts
CREATE POLICY organizations_bypass_policy ON organizations
  FOR ALL
  USING (current_setting('app.bypass_rls', true) = 'true');

CREATE POLICY organization_members_bypass_policy ON organization_members
  FOR ALL
  USING (current_setting('app.bypass_rls', true) = 'true');

CREATE POLICY projects_bypass_policy ON projects
  FOR ALL
  USING (current_setting('app.bypass_rls', true) = 'true');

CREATE POLICY invitations_bypass_policy ON invitations
  FOR ALL
  USING (current_setting('app.bypass_rls', true) = 'true');

