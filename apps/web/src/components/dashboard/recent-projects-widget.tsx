/**
 * Recent Projects Widget Component
 *
 * Displays recent projects on the dashboard.
 */

import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { EmptyState } from '@/components/shared/empty-state';
import { Separator } from '@/components/ui/separator';
import { FolderKanban, Calendar } from 'lucide-react';
import type { Project } from '@/types/project';

interface RecentProjectsWidgetProps {
  projects: Project[];
}

export function RecentProjectsWidget({ projects }: RecentProjectsWidgetProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Projects</CardTitle>
      </CardHeader>
      <CardContent>
        {projects.length === 0 ? (
          <EmptyState
            icon={FolderKanban}
            title="No projects yet"
            description="Create your first project to get started"
            action={{
              label: 'Create Project',
              href: '/projects/new',
            }}
          />
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
      {projects.length > 0 && (
        <CardFooter>
          <Link
            href="/projects"
            className="text-sm text-primary hover:underline"
          >
            View all projects →
          </Link>
        </CardFooter>
      )}
    </Card>
  );
}

