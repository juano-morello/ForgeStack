'use client';

/**
 * Audit Log Detail Dialog Component
 *
 * Modal dialog for viewing full audit log details including changes diff.
 * Uses shadcn/ui Dialog component.
 */

import { formatDistanceToNow } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { ActionBadge } from './action-badge';
import { ChangesDiff } from './changes-diff';
import { getResourceTypeLabel } from '@/lib/audit-log-constants';
import type { AuditLog } from '@/types/audit-logs';

interface AuditLogDetailDialogProps {
  log: AuditLog | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AuditLogDetailDialog({
  log,
  open,
  onOpenChange,
}: AuditLogDetailDialogProps) {
  if (!log) {
    return null;
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      relative: formatDistanceToNow(date, { addSuffix: true }),
      absolute: date.toLocaleString(),
    };
  };

  const date = formatDate(log.createdAt);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ActionBadge action={log.action} />
            <span className="text-muted-foreground">•</span>
            <span className="text-sm font-normal text-muted-foreground">
              {date.relative}
            </span>
          </DialogTitle>
          <DialogDescription>
            Full details of this audit log entry
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Actor Information */}
          <div>
            <h3 className="text-sm font-semibold mb-2">Actor</h3>
            <div className="rounded-md border p-3 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Type:</span>
                <span className="text-sm font-medium capitalize">{log.actorType}</span>
              </div>
              {log.actorName && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Name:</span>
                  <span className="text-sm font-medium">{log.actorName}</span>
                </div>
              )}
              {log.actorEmail && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Email:</span>
                  <span className="text-sm font-medium">{log.actorEmail}</span>
                </div>
              )}
            </div>
          </div>

          {/* Resource Information */}
          <div>
            <h3 className="text-sm font-semibold mb-2">Resource</h3>
            <div className="rounded-md border p-3 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Type:</span>
                <span className="text-sm font-medium">
                  {getResourceTypeLabel(log.resourceType)}
                </span>
              </div>
              {log.resourceName && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Name:</span>
                  <span className="text-sm font-medium">{log.resourceName}</span>
                </div>
              )}
              {log.resourceId && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">ID:</span>
                  <span className="text-sm font-mono text-xs">{log.resourceId}</span>
                </div>
              )}
            </div>
          </div>

          {/* Changes */}
          {log.changes && (
            <div>
              <h3 className="text-sm font-semibold mb-2">Changes</h3>
              <ChangesDiff changes={log.changes} />
            </div>
          )}

          {/* Metadata */}
          {log.metadata && Object.keys(log.metadata).length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-2">Metadata</h3>
              <div className="rounded-md border p-3">
                <pre className="text-xs font-mono overflow-x-auto">
                  {JSON.stringify(log.metadata, null, 2)}
                </pre>
              </div>
            </div>
          )}

          <Separator />

          {/* Technical Details */}
          <div>
            <h3 className="text-sm font-semibold mb-2">Technical Details</h3>
            <div className="rounded-md border p-3 space-y-1 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Log ID:</span>
                <span className="font-mono">{log.id}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Timestamp:</span>
                <span className="font-mono">{date.absolute}</span>
              </div>
              {log.ipAddress && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">IP Address:</span>
                  <span className="font-mono">{log.ipAddress}</span>
                </div>
              )}
              {log.userAgent && (
                <div className="flex items-start justify-between gap-2">
                  <span className="text-muted-foreground shrink-0">User Agent:</span>
                  <span className="font-mono text-right break-all">{log.userAgent}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

