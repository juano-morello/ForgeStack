'use client';

/**
 * Overrides List Component
 *
 * Displays organization overrides for a feature flag.
 */

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Trash2, Plus } from 'lucide-react';
import type { FeatureOverride } from '@/types/feature-flags';

interface OverridesListProps {
  overrides: FeatureOverride[];
  isLoading: boolean;
  onAdd: () => void;
  onDelete: (override: FeatureOverride) => void;
}

export function OverridesList({ overrides, isLoading, onAdd, onDelete }: OverridesListProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Organization Overrides</h3>
          <p className="text-sm text-muted-foreground">
            Override the default behavior for specific organizations
          </p>
        </div>
        <Button onClick={onAdd} size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Add Override
        </Button>
      </div>

      {overrides.length === 0 ? (
        <div className="rounded-md border p-8 text-center text-muted-foreground">
          No overrides configured. Add an override to enable or disable this feature for specific
          organizations.
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Organization</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {overrides.map((override) => (
                <TableRow key={override.id}>
                  <TableCell className="font-medium">
                    {override.orgName || override.orgId}
                  </TableCell>
                  <TableCell>
                    <Badge variant={override.enabled ? 'default' : 'secondary'}>
                      {override.enabled ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {override.reason || '—'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete(override)}
                      title="Delete override"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

