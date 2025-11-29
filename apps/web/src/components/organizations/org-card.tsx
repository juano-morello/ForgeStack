'use client';

/**
 * Organization Card Component
 *
 * Displays an organization with its details in a card format.
 * Shows name, role badge, created date, and action buttons.
 */

import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Building2, Calendar, Settings, Trash2 } from 'lucide-react';
import type { Organization } from '@/types/organization';
import { cn } from '@/lib/utils';

interface OrgCardProps {
  org: Organization;
  onSelect?: (org: Organization) => void;
  onEdit?: (org: Organization) => void;
  onDelete?: (org: Organization) => void;
  isSelected?: boolean;
  className?: string;
}

export function OrgCard({
  org,
  onSelect,
  onEdit,
  onDelete,
  isSelected = false,
  className,
}: OrgCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <Card
      className={cn(
        'transition-all hover:shadow-md cursor-pointer',
        isSelected && 'ring-2 ring-primary',
        className
      )}
      onClick={() => onSelect?.(org)}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">{org.name}</CardTitle>
              <CardDescription className="flex items-center gap-1 mt-1">
                <Calendar className="h-3 w-3" />
                <span className="text-xs">Created {formatDate(org.createdAt)}</span>
              </CardDescription>
            </div>
          </div>
          {org.role && (
            <Badge
              variant={org.role === 'OWNER' ? 'default' : 'secondary'}
              className="ml-2"
            >
              {org.role}
            </Badge>
          )}
        </div>
      </CardHeader>
      
      {(org.memberCount !== undefined || onEdit || onDelete) && (
        <CardFooter className="flex items-center justify-between pt-0">
          <div className="text-sm text-muted-foreground">
            {org.memberCount !== undefined && (
              <span>{org.memberCount} {org.memberCount === 1 ? 'member' : 'members'}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {onEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(org);
                }}
              >
                <Settings className="h-4 w-4" />
              </Button>
            )}
            {onDelete && org.role === 'OWNER' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(org);
                }}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            )}
          </div>
        </CardFooter>
      )}
    </Card>
  );
}

