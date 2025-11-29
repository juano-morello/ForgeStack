'use client';

/**
 * Project List Component
 *
 * Displays a grid of project cards with loading and empty states.
 * Uses shadcn/ui components for consistent styling.
 */

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useProjects } from '@/hooks/use-projects';
import { ProjectCard } from './project-card';
import { DeleteProjectDialog } from './delete-project-dialog';
import { EmptyState } from '@/components/shared/empty-state';
import { CardSkeleton } from '@/components/shared/loading-skeleton';
import { Input } from '@/components/ui/input';
import { FolderKanban, Search } from 'lucide-react';
import type { Project } from '@/types/project';

export function ProjectList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { projects, isLoading, error, fetchProjects, deleteProject } = useProjects();
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Debounce search and update URL
  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (search) {
        params.set('search', search);
      } else {
        params.delete('search');
      }
      router.replace(`/projects?${params.toString()}`);
    }, 300);

    return () => clearTimeout(timer);
  }, [search, router, searchParams]);

  // Fetch projects when search param changes
  const loadProjects = useCallback(async () => {
    const searchQuery = searchParams.get('search') || undefined;
    await fetchProjects({ search: searchQuery });
  }, [fetchProjects, searchParams]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const handleEdit = (project: Project) => {
    router.push(`/projects/${project.id}/edit`);
  };

  const handleDeleteClick = (project: Project) => {
    setProjectToDelete(project);
  };

  const handleConfirmDelete = async () => {
    if (!projectToDelete) return;
    setIsDeleting(true);
    try {
      await deleteProject(projectToDelete.id);
      setProjectToDelete(null);
    } catch (error) {
      // Error is already handled and displayed by the useProjects hook
      // Log for debugging in development
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to delete project:', error);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading && projects.length === 0) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-destructive/10 p-4">
        <p className="text-sm text-destructive">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search projects..."
          className="pl-9"
        />
      </div>

      {/* Empty State */}
      {projects.length === 0 && (
        <EmptyState
          icon={FolderKanban}
          title="No projects found"
          description={
            search
              ? 'Try a different search term.'
              : 'Create your first project to get started.'
          }
        />
      )}

      {/* Project Grid */}
      {projects.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onEdit={handleEdit}
              onDelete={handleDeleteClick}
            />
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <DeleteProjectDialog
        project={projectToDelete}
        isOpen={!!projectToDelete}
        isDeleting={isDeleting}
        onClose={() => setProjectToDelete(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}

