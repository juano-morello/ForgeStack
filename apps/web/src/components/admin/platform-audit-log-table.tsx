'use client';

/**
 * Platform Audit Log Table Component
 *
 * Displays platform-level audit logs for super-admin actions.
 */

import { formatDistanceToNow } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { PlatformAuditLog } from '@/types/admin';

interface PlatformAuditLogTableProps {
  logs: PlatformAuditLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  onPageChange: (page: number) => void;
}

const ACTION_LABELS: Record<string, string> = {
  'user.suspended': 'User Suspended',
  'user.unsuspended': 'User Unsuspended',
  'user.deleted': 'User Deleted',
  'organization.suspended': 'Org Suspended',
  'organization.unsuspended': 'Org Unsuspended',
  'organization.deleted': 'Org Deleted',
  'organization.ownership_transferred': 'Ownership Transferred',
};

const RESOURCE_TYPE_COLORS: Record<string, 'default' | 'secondary' | 'destructive'> = {
  user: 'default',
  organization: 'secondary',
};

export function PlatformAuditLogTable({
  logs,
  pagination,
  onPageChange,
}: PlatformAuditLogTableProps) {
  const canGoPrevious = pagination.page > 1;
  const canGoNext = pagination.page < pagination.totalPages;

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Time</TableHead>
              <TableHead>Actor</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Resource</TableHead>
              <TableHead>Target Org</TableHead>
              <TableHead>IP Address</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  No audit logs found
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{log.actorEmail}</span>
                      <span className="text-xs text-muted-foreground font-mono">
                        {log.actorId.slice(0, 8)}...
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm font-medium">
                      {ACTION_LABELS[log.action] || log.action}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <Badge variant={RESOURCE_TYPE_COLORS[log.resourceType] || 'default'}>
                        {log.resourceType}
                      </Badge>
                      {log.resourceName && (
                        <span className="text-xs text-muted-foreground">{log.resourceName}</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {log.targetOrgName || '-'}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground font-mono">
                    {log.ipAddress || '-'}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
          {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
          {pagination.total} logs
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(pagination.page - 1)}
            disabled={!canGoPrevious}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          <div className="text-sm font-medium">
            Page {pagination.page} of {pagination.totalPages}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(pagination.page + 1)}
            disabled={!canGoNext}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}

