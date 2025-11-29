'use client';

/**
 * Organizations Page
 *
 * Lists all organizations the user belongs to.
 * Provides navigation to create new organizations.
 */

import { OrgList } from '@/components/organizations/org-list';
import { CreateOrgDialog } from '@/components/organizations/create-org-dialog';
import { ProtectedHeader } from '@/components/layout/protected-header';
import { PageHeader } from '@/components/layout/page-header';

export default function OrganizationsPage() {
  return (
    <div className="min-h-screen bg-background">
      <ProtectedHeader />

      <main className="container mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <PageHeader
          title="Organizations"
          description="Manage your organizations and team workspaces"
          actions={<CreateOrgDialog />}
        />

        <OrgList />
      </main>
    </div>
  );
}

