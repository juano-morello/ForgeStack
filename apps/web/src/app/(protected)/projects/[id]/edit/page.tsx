'use client';

/**
 * Edit Project Page
 *
 * Page for editing an existing project.
 */

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useOrgContext } from '@/components/providers/org-provider';
import { ProjectForm } from '@/components/projects/project-form';
import { useProjects } from '@/hooks/use-projects';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft } from 'lucide-react';
import type { Project, UpdateProjectDto } from '@/types/project';

export default function EditProjectPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;

  const { currentOrg, isLoading: isOrgLoading } = useOrgContext();
  const { getProject, updateProject } = useProjects();

  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!projectId || isOrgLoading) return;

    const loadProject = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getProject(projectId);
        setProject(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load project');
      } finally {
        setIsLoading(false);
      }
    };

    loadProject();
  }, [projectId, getProject, isOrgLoading]);

  const handleSubmit = async (data: UpdateProjectDto) => {
    if (!project) return;
    setIsSubmitting(true);
    try {
      await updateProject(project.id, data);
      router.push(`/projects/${project.id}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push(`/projects/${projectId}`);
  };

  if (isLoading || isOrgLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-4 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold">Error</h2>
        <p className="mt-2 text-destructive">{error}</p>
        <Button variant="link" asChild className="mt-4">
          <Link href="/projects">
            <ArrowLeft className="h-4 w-4" />
            Back to Projects
          </Link>
        </Button>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold">Project Not Found</h2>
        <Button variant="link" asChild className="mt-4">
          <Link href="/projects">
            <ArrowLeft className="h-4 w-4" />
            Back to Projects
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Edit Project"
        description={`Update project details in ${currentOrg?.name}`}
        actions={
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/projects/${project.id}`}>
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
          </Button>
        }
      />

      <Card>
        <CardContent className="pt-6">
          <ProjectForm
            project={project}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isSubmitting={isSubmitting}
          />
        </CardContent>
      </Card>
    </>
  );
}

