'use client';

/**
 * Audit Log Filters Component
 *
 * Filter panel for audit logs with action, resource type, actor, and date filters.
 * Uses shadcn/ui components.
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { X } from 'lucide-react';
import type { AuditLogFilters } from '@/types/audit-logs';

interface AuditLogFiltersProps {
  filters: AuditLogFilters;
  onFiltersChange: (filters: AuditLogFilters) => void;
}

export function AuditLogFilters({ filters, onFiltersChange }: AuditLogFiltersProps) {
  const [localFilters, setLocalFilters] = useState<AuditLogFilters>(filters);

  const handleApply = () => {
    onFiltersChange(localFilters);
  };

  const handleClear = () => {
    const clearedFilters: AuditLogFilters = {};
    setLocalFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  const hasActiveFilters = Object.keys(localFilters).some(
    key => key !== 'page' && key !== 'limit' && localFilters[key as keyof AuditLogFilters]
  );

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Action Filter */}
            <div className="space-y-2">
              <Label htmlFor="action-filter">Action</Label>
              <Select
                value={localFilters.action || 'all'}
                onValueChange={(value) =>
                  setLocalFilters({ ...localFilters, action: value === 'all' ? undefined : value })
                }
              >
                <SelectTrigger id="action-filter">
                  <SelectValue placeholder="All Actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="created">Created</SelectItem>
                  <SelectItem value="updated">Updated</SelectItem>
                  <SelectItem value="deleted">Deleted</SelectItem>
                  <SelectItem value="invited">Invited</SelectItem>
                  <SelectItem value="joined">Joined</SelectItem>
                  <SelectItem value="removed">Removed</SelectItem>
                  <SelectItem value="revoked">Revoked</SelectItem>
                  <SelectItem value="rotated">Rotated</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Resource Type Filter */}
            <div className="space-y-2">
              <Label htmlFor="resource-filter">Resource Type</Label>
              <Select
                value={localFilters.resourceType || 'all'}
                onValueChange={(value) =>
                  setLocalFilters({ ...localFilters, resourceType: value === 'all' ? undefined : value })
                }
              >
                <SelectTrigger id="resource-filter">
                  <SelectValue placeholder="All Resources" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Resources</SelectItem>
                  <SelectItem value="project">Project</SelectItem>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="api_key">API Key</SelectItem>
                  <SelectItem value="webhook_endpoint">Webhook</SelectItem>
                  <SelectItem value="file">File</SelectItem>
                  <SelectItem value="settings">Settings</SelectItem>
                  <SelectItem value="billing">Billing</SelectItem>
                  <SelectItem value="auth">Authentication</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Actor Email Filter */}
            <div className="space-y-2">
              <Label htmlFor="actor-filter">Actor Email</Label>
              <Input
                id="actor-filter"
                type="text"
                placeholder="Search by email..."
                value={localFilters.actorEmail || ''}
                onChange={(e) =>
                  setLocalFilters({ ...localFilters, actorEmail: e.target.value || undefined })
                }
              />
            </div>

            {/* Date From Filter */}
            <div className="space-y-2">
              <Label htmlFor="date-from-filter">Date From</Label>
              <Input
                id="date-from-filter"
                type="date"
                value={localFilters.dateFrom || ''}
                onChange={(e) =>
                  setLocalFilters({ ...localFilters, dateFrom: e.target.value || undefined })
                }
              />
            </div>
          </div>

          {/* Second Row - Date To and Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Date To Filter */}
            <div className="space-y-2">
              <Label htmlFor="date-to-filter">Date To</Label>
              <Input
                id="date-to-filter"
                type="date"
                value={localFilters.dateTo || ''}
                onChange={(e) =>
                  setLocalFilters({ ...localFilters, dateTo: e.target.value || undefined })
                }
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-end gap-2 lg:col-span-3">
              <Button onClick={handleApply} className="flex-1 md:flex-none">
                Apply Filters
              </Button>
              {hasActiveFilters && (
                <Button variant="outline" onClick={handleClear}>
                  <X className="h-4 w-4 mr-2" />
                  Clear
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

