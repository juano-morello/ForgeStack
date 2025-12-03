'use client';

/**
 * Admin Platform Audit Logs Page
 *
 * View platform-level audit logs with filters.
 */

import { useState } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { PlatformAuditLogTable } from '@/components/admin/platform-audit-log-table';
import { usePlatformAuditLogs } from '@/hooks/use-admin';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, X } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

export default function AdminAuditLogsPage() {
  const [actorEmail, setActorEmail] = useState('');
  const [actorEmailInput, setActorEmailInput] = useState('');
  const [action, setAction] = useState<string>('all');
  const [resourceType, setResourceType] = useState<string>('all');

  const { logs, pagination, isLoading, error, fetchLogs } = usePlatformAuditLogs({
    autoFetch: true,
    actorEmail,
    action: action === 'all' ? undefined : action,
    resourceType: resourceType === 'all' ? undefined : resourceType,
  });

  const handleSearch = () => {
    setActorEmail(actorEmailInput);
    fetchLogs({
      actorEmail: actorEmailInput,
      action: action === 'all' ? undefined : action,
      resourceType: resourceType === 'all' ? undefined : resourceType,
      page: 1,
    });
  };

  const handleActionChange = (value: string) => {
    setAction(value);
    fetchLogs({
      actorEmail,
      action: value === 'all' ? undefined : value,
      resourceType: resourceType === 'all' ? undefined : resourceType,
      page: 1,
    });
  };

  const handleResourceTypeChange = (value: string) => {
    setResourceType(value);
    fetchLogs({
      actorEmail,
      action: action === 'all' ? undefined : action,
      resourceType: value === 'all' ? undefined : value,
      page: 1,
    });
  };

  const handleClearFilters = () => {
    setActorEmail('');
    setActorEmailInput('');
    setAction('all');
    setResourceType('all');
    fetchLogs({ page: 1 });
  };

  const handlePageChange = (page: number) => {
    fetchLogs({
      actorEmail,
      action: action === 'all' ? undefined : action,
      resourceType: resourceType === 'all' ? undefined : resourceType,
      page,
    });
  };

  const hasActiveFilters = actorEmail || action !== 'all' || resourceType !== 'all';

  return (
    <div className="space-y-6">
      <PageHeader
        title="Platform Audit Logs"
        description="View all super-admin actions across the platform"
      />

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 flex gap-2">
                <Input
                  placeholder="Search by actor email..."
                  value={actorEmailInput}
                  onChange={(e) => setActorEmailInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button onClick={handleSearch}>
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
              </div>

              <Select value={action} onValueChange={handleActionChange}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filter by action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="user.suspended">User Suspended</SelectItem>
                  <SelectItem value="user.unsuspended">User Unsuspended</SelectItem>
                  <SelectItem value="user.deleted">User Deleted</SelectItem>
                  <SelectItem value="organization.suspended">Org Suspended</SelectItem>
                  <SelectItem value="organization.unsuspended">Org Unsuspended</SelectItem>
                  <SelectItem value="organization.deleted">Org Deleted</SelectItem>
                  <SelectItem value="organization.ownership_transferred">
                    Ownership Transferred
                  </SelectItem>
                </SelectContent>
              </Select>

              <Select value={resourceType} onValueChange={handleResourceTypeChange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by resource" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Resources</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="organization">Organization</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {hasActiveFilters && (
              <Button variant="outline" size="sm" onClick={handleClearFilters}>
                <X className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Audit Logs Table */}
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : (
        <PlatformAuditLogTable
          logs={logs}
          pagination={pagination}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
}

