'use client';

/**
 * Organizations Page
 *
 * Lists all organizations the user belongs to.
 * Provides navigation to create new organizations.
 */

import { OrgList } from '@/components/organizations/org-list';
import { CreateOrgDialog } from '@/components/organizations/create-org-dialog';
import { PageHeader } from '@/components/layout/page-header';

export default function OrganizationsPage() {
  return (
    <>
      <PageHeader
        title="Organizations"
        description="Manage your organizations and team workspaces"
        actions={<CreateOrgDialog />}
      />

      <OrgList />
    </>
  );
}

