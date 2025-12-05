'use client';

/**
 * Audit Logs Settings Page
 *
 * Displays audit logs for the organization with filtering and pagination.
 * Only accessible to users with OWNER role.
 */

import { useState } from 'react';
import { useOrgContext } from '@/components/providers/org-provider';
import { useAuditLogs } from '@/hooks/use-audit-logs';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AuditLogsList } from '@/components/audit-logs/audit-logs-list';
import { AuditLogFilters } from '@/components/audit-logs/audit-log-filters';
import { exportAuditLogs } from '@/lib/api/audit-logs';
import { useToast } from '@/hooks/use-toast';
import { ShieldAlert, XCircle, Download, Loader2 } from 'lucide-react';
import type { AuditLogFilters as Filters } from '@/types/audit-logs';

export default function AuditLogsPage() {
  const { currentOrg, isLoading: isOrgLoading } = useOrgContext();
  const { toast } = useToast();
  const [filters, setFilters] = useState<Filters>({});
  const [isExporting, setIsExporting] = useState(false);

  const {
    logs,
    isLoading: isLogsLoading,
    error: logsError,
    pagination,
    loadPage,
    fetchLogs,
  } = useAuditLogs({
    orgId: currentOrg?.id || '',
    filters,
    autoFetch: !!currentOrg,
  });

  const isOwner = currentOrg?.role === 'OWNER';

  const handleFiltersChange = (newFilters: Filters) => {
    setFilters(newFilters);
    // Fetch logs with new filters, reset to page 1
    fetchLogs({ ...newFilters, page: 1 });
  };

  const handlePageChange = (page: number) => {
    loadPage(page);
  };

  const handleExport = async (format: 'csv' | 'json') => {
    if (!currentOrg) return;

    setIsExporting(true);
    try {
      const blob = await exportAuditLogs(currentOrg.id, filters, format);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-logs-${currentOrg.id}-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: 'Export successful',
        description: `Audit logs exported as ${format.toUpperCase()}`,
      });
    } catch (error) {
      console.error('Export failed:', error);
      toast({
        title: 'Export failed',
        description: error instanceof Error ? error.message : 'Failed to export audit logs',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  if (isOrgLoading) {
    return (
      <>
        <PageHeader title="Audit Logs" description="Loading..." />
        <div className="space-y-6">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </>
    );
  }

  if (!currentOrg) {
    return (
      <Alert variant="destructive">
        <XCircle className="h-4 w-4" />
        <AlertDescription>
          Please select an organization to view audit logs.
        </AlertDescription>
      </Alert>
    );
  }

  if (!isOwner) {
    return (
      <>
        <PageHeader
          title="Audit Logs"
          description={`Audit logs for ${currentOrg.name}`}
        />
        <Alert variant="destructive">
          <ShieldAlert className="h-4 w-4" />
          <AlertDescription>
            Only organization owners can view audit logs. Please contact an owner if you need
            access.
          </AlertDescription>
        </Alert>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Audit Logs"
        description={`View and export audit logs for ${currentOrg.name}`}
      />

      <div className="space-y-6">
          {/* Info Section */}
          <div className="rounded-lg border bg-muted/50 p-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <h3 className="font-semibold">About Audit Logs</h3>
                <p className="text-sm text-muted-foreground">
                  Audit logs track all significant actions in your organization for security and compliance.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport('csv')}
                disabled={isExporting || logs.length === 0}
              >
                {isExporting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                Export CSV
              </Button>
            </div>
          </div>

          {/* Filters */}
          <AuditLogFilters filters={filters} onFiltersChange={handleFiltersChange} />

          {/* Error Alert */}
          {logsError && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{logsError}</AlertDescription>
            </Alert>
          )}

          {/* Logs List */}
          <AuditLogsList
            logs={logs}
            isLoading={isLogsLoading}
            pagination={pagination}
            onPageChange={handlePageChange}
          />
      </div>
    </>
  );
}

