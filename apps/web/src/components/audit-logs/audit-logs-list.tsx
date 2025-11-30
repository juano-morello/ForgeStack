'use client';

/**
 * Audit Logs List Component
 *
 * Displays a table of audit log entries with pagination.
 * Uses shadcn/ui Table component.
 */

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/shared/empty-state';
import { ActionBadge } from './action-badge';
import { AuditLogDetailDialog } from './audit-log-detail-dialog';
import { getResourceTypeLabel } from '@/lib/audit-log-constants';
import { ScrollText, ChevronLeft, ChevronRight } from 'lucide-react';
import type { AuditLog } from '@/types/audit-logs';

interface AuditLogsListProps {
  logs: AuditLog[];
  isLoading: boolean;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  onPageChange: (page: number) => void;
}

export function AuditLogsList({
  logs,
  isLoading,
  pagination,
  onPageChange,
}: AuditLogsListProps) {
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);

  const handleRowClick = (log: AuditLog) => {
    setSelectedLog(log);
    setIsDetailDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDetailDialogOpen(false);
    // Delay clearing selected log to avoid flash during close animation
    setTimeout(() => setSelectedLog(null), 200);
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <EmptyState
        icon={ScrollText}
        title="No audit logs found"
        description="No audit log entries match your current filters. Try adjusting your search criteria."
      />
    );
  }

  const formatDate = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  };

  const canGoPrevious = pagination.page > 1;
  const canGoNext = pagination.page < pagination.totalPages;

  return (
    <>
      <div className="space-y-4">
        {/* Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Resource</TableHead>
                <TableHead>IP Address</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow
                  key={log.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleRowClick(log)}
                >
                  <TableCell className="font-medium">
                    <span className="text-sm">{formatDate(log.createdAt)}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      {log.actorName && (
                        <span className="text-sm font-medium">{log.actorName}</span>
                      )}
                      {log.actorEmail && (
                        <span className="text-xs text-muted-foreground">
                          {log.actorEmail}
                        </span>
                      )}
                      {!log.actorName && !log.actorEmail && (
                        <span className="text-sm text-muted-foreground capitalize">
                          {log.actorType}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <ActionBadge action={log.action} />
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">
                        {getResourceTypeLabel(log.resourceType)}
                      </span>
                      {log.resourceName && (
                        <span className="text-xs text-muted-foreground">
                          {log.resourceName}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm font-mono text-muted-foreground">
                      {log.ipAddress || '—'}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
            {pagination.total} entries
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

      {/* Detail Dialog */}
      <AuditLogDetailDialog
        log={selectedLog}
        open={isDetailDialogOpen}
        onOpenChange={handleDialogClose}
      />
    </>
  );
}

