'use client';

/**
 * Feature Flags List Component
 *
 * Displays a table of all feature flags with search/filter and inline actions.
 */

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Search, Edit, Trash2, Settings } from 'lucide-react';
import { getFlagTypeLabel } from '@/lib/feature-flag-constants';
import type { FeatureFlag } from '@/types/feature-flags';

interface FeatureFlagsListProps {
  flags: FeatureFlag[];
  isLoading: boolean;
  onEdit: (flag: FeatureFlag) => void;
  onDelete: (flag: FeatureFlag) => void;
  onToggleEnabled: (flag: FeatureFlag, enabled: boolean) => Promise<void>;
  onViewOverrides?: (flag: FeatureFlag) => void;
}

export function FeatureFlagsList({
  flags,
  isLoading,
  onEdit,
  onDelete,
  onToggleEnabled,
  onViewOverrides,
}: FeatureFlagsListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Filter flags based on search query
  const filteredFlags = flags.filter(
    (flag) =>
      flag.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      flag.key.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleToggle = async (flag: FeatureFlag, checked: boolean) => {
    setTogglingId(flag.id);
    try {
      await onToggleEnabled(flag, checked);
    } finally {
      setTogglingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name or key..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Key</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredFlags.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  {searchQuery ? 'No flags found matching your search' : 'No feature flags yet'}
                </TableCell>
              </TableRow>
            ) : (
              filteredFlags.map((flag) => (
                <TableRow key={flag.id} className="cursor-pointer" onClick={() => onEdit(flag)}>
                  <TableCell className="font-medium">
                    <div>
                      <div>{flag.name}</div>
                      {flag.description && (
                        <div className="text-sm text-muted-foreground line-clamp-1">
                          {flag.description}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <code className="text-sm bg-muted px-2 py-1 rounded">{flag.key}</code>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{getFlagTypeLabel(flag.type)}</Badge>
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={flag.enabled}
                        onCheckedChange={(checked) => handleToggle(flag, checked)}
                        disabled={togglingId === flag.id}
                      />
                      <span className="text-sm text-muted-foreground">
                        {flag.enabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-end gap-2">
                      {onViewOverrides && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onViewOverrides(flag)}
                          title="View overrides"
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(flag)}
                        title="Edit flag"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(flag)}
                        title="Delete flag"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

