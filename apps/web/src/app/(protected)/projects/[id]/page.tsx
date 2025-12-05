'use client';

/**
 * Project Detail Page
 *
 * Displays details of a single project.
 */

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useOrgContext } from '@/components/providers/org-provider';
import { useProjects } from '@/hooks/use-projects';
import { DeleteProjectDialog } from '@/components/projects/delete-project-dialog';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Edit, Trash2, Calendar, Clock } from 'lucide-react';
import type { Project } from '@/types/project';

export default function ProjectDetailPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;

  const { currentOrg, isLoading: isOrgLoading } = useOrgContext();
  const { getProject, deleteProject } = useProjects();

  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleDelete = async () => {
    if (!project) return;
    setIsDeleting(true);
    try {
      await deleteProject(project.id);
      router.push('/projects');
    } catch {
      // Error handled by hook
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading || isOrgLoading) {
    return (
      <div className="max-w-4xl">
        <div className="space-y-4">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-4 w-64" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl">
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
      </div>
    );
  }

  if (!project) {
    return (
      <div className="max-w-4xl">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold">Project Not Found</h2>
          <Button variant="link" asChild className="mt-4">
            <Link href="/projects">
              <ArrowLeft className="h-4 w-4" />
              Back to Projects
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const isOwner = currentOrg?.role === 'OWNER';

  return (
    <>
      <PageHeader
          title={project.name}
          description={currentOrg?.name}
          actions={
            <div className="flex gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href="/projects">
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/projects/${project.id}/edit`}>
                  <Edit className="h-4 w-4" />
                  Edit
                </Link>
              </Button>
              {isOwner && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              )}
            </div>
          }
        />

        <div className="space-y-6">
          {/* Description Card */}
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {project.description || 'No description provided.'}
              </p>
            </CardContent>
          </Card>

          {/* Metadata Card */}
          <Card>
            <CardHeader>
              <CardTitle>Project Information</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex items-start gap-3">
                  <div className="rounded-md bg-primary/10 p-2">
                    <Calendar className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Created</dt>
                    <dd className="mt-1 text-sm">{formatDate(project.createdAt)}</dd>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="rounded-md bg-primary/10 p-2">
                    <Clock className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Last Updated</dt>
                    <dd className="mt-1 text-sm">{formatDate(project.updatedAt)}</dd>
                  </div>
                </div>
              </dl>
            </CardContent>
          </Card>
        </div>

      <DeleteProjectDialog
        project={project}
        isOpen={showDeleteDialog}
        isDeleting={isDeleting}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
      />
    </>
  );
}

