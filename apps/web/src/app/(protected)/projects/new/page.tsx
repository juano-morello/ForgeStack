'use client';

/**
 * New Project Page
 *
 * Page for creating a new project.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useOrgContext } from '@/components/providers/org-provider';
import { ProjectForm } from '@/components/projects/project-form';
import { useProjects } from '@/hooks/use-projects';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/shared/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Building2 } from 'lucide-react';
import type { CreateProjectDto } from '@/types/project';

export default function NewProjectPage() {
  const router = useRouter();
  const { currentOrg, isLoading: isOrgLoading } = useOrgContext();
  const { createProject } = useProjects();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: CreateProjectDto) => {
    setIsSubmitting(true);
    try {
      await createProject(data);
      router.push('/projects');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push('/projects');
  };

  if (isOrgLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-4 w-64" />
        <Skeleton className="h-64 w-full" />
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
        title="Create New Project"
        description={`Create a new project in ${currentOrg.name}`}
        actions={
          <Button variant="ghost" size="sm" asChild>
            <Link href="/projects">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
          </Button>
        }
      />

      <Card>
        <CardContent className="pt-6">
          <ProjectForm
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isSubmitting={isSubmitting}
          />
        </CardContent>
      </Card>
    </>
  );
}

