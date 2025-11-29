'use client';

/**
 * Recent Projects Component
 *
 * Displays the most recent projects for the dashboard.
 * Uses shadcn/ui Card components for consistent styling.
 */

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { useProjects } from '@/hooks/use-projects';
import { FolderKanban, ArrowRight, Calendar } from 'lucide-react';
import type { Project } from '@/types/project';

interface RecentProjectsProps {
  limit?: number;
}

export function RecentProjects({ limit = 5 }: RecentProjectsProps) {
  const { fetchProjects } = useProjects();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProjects = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchProjects({ limit });
      setProjects(data.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load projects');
    } finally {
      setIsLoading(false);
    }
  }, [fetchProjects, limit]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Projects</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <Skeleton className="h-3 w-16" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Projects</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Recent Projects</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/projects">
              View all
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {projects.length === 0 ? (
          <div className="text-center py-6">
            <div className="mx-auto rounded-full bg-muted p-3 w-fit">
              <FolderKanban className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="mt-3 text-sm text-muted-foreground">No projects yet</p>
            <Button variant="link" size="sm" asChild className="mt-2">
              <Link href="/projects/new">
                Create your first project
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-1">
            {projects.map((project, index) => (
              <div key={project.id}>
                {index > 0 && <Separator />}
                <Link
                  href={`/projects/${project.id}`}
                  className="block py-3 px-2 -mx-2 rounded-md hover:bg-accent transition-colors"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="rounded-md bg-primary/10 p-1.5">
                        <FolderKanban className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {project.name}
                        </p>
                        {project.description && (
                          <p className="text-xs text-muted-foreground truncate">
                            {project.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>{formatDate(project.createdAt)}</span>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

