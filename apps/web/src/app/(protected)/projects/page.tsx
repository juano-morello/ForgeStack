'use client';

/**
 * Projects List Page
 *
 * Displays all projects for the current organization.
 */

import Link from 'next/link';
import { useOrgContext } from '@/components/providers/org-provider';
import { ProjectList } from '@/components/projects/project-list';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/shared/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Building2 } from 'lucide-react';

export default function ProjectsPage() {
  const { currentOrg, isLoading: isOrgLoading } = useOrgContext();

  if (isOrgLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
    );
  }

  if (!currentOrg) {
    return (
      <EmptyState
        icon={Building2}
        title="No Organization Selected"
        description="Please select or create an organization first."
        action={{
          label: 'Create Organization',
          href: '/organizations/new',
        }}
      />
    );
  }

  return (
    <>
      <PageHeader
        title="Projects"
        description={currentOrg.name}
        actions={
          <Button asChild>
            <Link href="/projects/new">
              <Plus className="h-4 w-4" />
              New Project
            </Link>
          </Button>
        }
      />

      <ProjectList />
    </>
  );
}

