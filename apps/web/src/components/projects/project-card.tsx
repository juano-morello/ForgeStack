'use client';

/**
 * Project Card Component
 *
 * Displays a single project in a card format with actions.
 * Uses shadcn/ui Card components with FolderKanban icon.
 */

import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FolderKanban, Calendar, Edit, Trash2 } from 'lucide-react';
import type { Project } from '@/types/project';
import { cn } from '@/lib/utils';

interface ProjectCardProps {
  project: Project;
  onEdit?: (project: Project) => void;
  onDelete?: (project: Project) => void;
  className?: string;
}

export function ProjectCard({ project, onEdit, onDelete, className }: ProjectCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Card
      className={cn(
        'group transition-all hover:shadow-md hover:ring-2 hover:ring-primary/20',
        className
      )}
    >
      <Link href={`/projects/${project.id}`} className="block">
        <CardHeader className="pb-3">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-primary/10 p-2 text-primary">
              <FolderKanban className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg truncate group-hover:text-primary transition-colors">
                {project.name}
              </CardTitle>
              {project.description && (
                <CardDescription className="mt-1 line-clamp-2">
                  {project.description}
                </CardDescription>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pb-3">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>Created {formatDate(project.createdAt)}</span>
            </div>
            {project.updatedAt !== project.createdAt && (
              <div className="flex items-center gap-1">
                <span>Updated {formatDate(project.updatedAt)}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Link>
      {(onEdit || onDelete) && (
        <CardFooter className="pt-3 border-t bg-muted/50 flex justify-end gap-2">
          {onEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                onEdit(project);
              }}
            >
              <Edit className="h-4 w-4" />
              Edit
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                onDelete(project);
              }}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  );
}

