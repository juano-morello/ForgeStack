'use client';

/**
 * Activity Filters Component
 *
 * Filter controls for activity feed.
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { X } from 'lucide-react';
import { ACTIVITY_TYPES, RESOURCE_TYPES } from '@/lib/activity-constants';
import type { ActivityFilters as ActivityFiltersType } from '@/types/activities';

interface ActivityFiltersProps {
  filters: ActivityFiltersType;
  onFiltersChange: (filters: ActivityFiltersType) => void;
}

export function ActivityFilters({ filters, onFiltersChange }: ActivityFiltersProps) {
  const [localType, setLocalType] = useState<string>(filters.type || 'all');
  const [localResourceType, setLocalResourceType] = useState<string>(filters.resourceType || 'all');

  useEffect(() => {
    setLocalType(filters.type || 'all');
    setLocalResourceType(filters.resourceType || 'all');
  }, [filters]);

  const handleApplyFilters = () => {
    const newFilters: ActivityFiltersType = {};
    
    if (localType !== 'all') {
      newFilters.type = localType;
    }
    if (localResourceType !== 'all') {
      newFilters.resourceType = localResourceType;
    }

    onFiltersChange(newFilters);
  };

  const handleClearFilters = () => {
    setLocalType('all');
    setLocalResourceType('all');
    onFiltersChange({});
  };

  const hasActiveFilters = filters.type || filters.resourceType;

  return (
    <div className="flex flex-col sm:flex-row gap-4 p-4 bg-muted/50 rounded-lg">
      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Activity Type Filter */}
        <div className="space-y-2">
          <label htmlFor="type-filter" className="text-sm font-medium">
            Activity Type
          </label>
          <Select value={localType} onValueChange={setLocalType}>
            <SelectTrigger id="type-filter">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              {Object.entries(ACTIVITY_TYPES).map(([key, value]) => (
                <SelectItem key={key} value={key}>
                  {value.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Resource Type Filter */}
        <div className="space-y-2">
          <label htmlFor="resource-filter" className="text-sm font-medium">
            Resource Type
          </label>
          <Select value={localResourceType} onValueChange={setLocalResourceType}>
            <SelectTrigger id="resource-filter">
              <SelectValue placeholder="All resources" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All resources</SelectItem>
              {Object.entries(RESOURCE_TYPES).map(([key, value]) => (
                <SelectItem key={key} value={key}>
                  {value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-end gap-2">
        <Button onClick={handleApplyFilters} size="sm">
          Apply Filters
        </Button>
        {hasActiveFilters && (
          <Button onClick={handleClearFilters} variant="outline" size="sm">
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}

