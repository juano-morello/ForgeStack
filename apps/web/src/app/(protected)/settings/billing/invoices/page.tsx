'use client';

/**
 * Invoice History Page
 *
 * Displays a full list of invoices with filtering and pagination.
 */

import { useState } from 'react';
import Link from 'next/link';
import { useOrgContext } from '@/components/providers/org-provider';
import { useInvoices } from '@/hooks/use-usage';
import { PageHeader } from '@/components/layout/page-header';
import { InvoiceTable } from '@/components/usage/invoice-table';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { XCircle, ArrowLeft } from 'lucide-react';

export default function InvoicesPage() {
  const { currentOrg, isLoading: isOrgLoading } = useOrgContext();
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data: invoices, isLoading: isInvoicesLoading } = useInvoices({
    orgId: currentOrg?.id || '',
    autoFetch: !!currentOrg?.id,
  });

  const isOwner = currentOrg?.role === 'OWNER';

  if (isOrgLoading) {
    return (
      <>
        <PageHeader
          title="Invoice History"
          description="Loading..."
        />
        <Skeleton className="h-96 w-full" />
      </>
    );
  }

  if (!currentOrg) {
    return (
      <Alert variant="destructive">
        <XCircle className="h-4 w-4" />
        <AlertDescription>
          Please select an organization to view invoices.
        </AlertDescription>
      </Alert>
    );
  }

  if (!isOwner) {
    return (
      <Alert variant="destructive">
        <XCircle className="h-4 w-4" />
        <AlertDescription>
          Only organization owners can view invoices.
        </AlertDescription>
      </Alert>
    );
  }

  // Filter invoices by status
  const filteredInvoices = statusFilter === 'all'
    ? invoices
    : invoices.filter(inv => inv.status === statusFilter);

  return (
    <>
      <div className="mb-6">
        <Button variant="ghost" asChild>
          <Link href="/settings/billing">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Billing
          </Link>
        </Button>
      </div>

      <PageHeader
        title="Invoice History"
        description={`All invoices for ${currentOrg.name}`}
      />

      <div className="mt-8">
          <Tabs defaultValue="all" onValueChange={setStatusFilter}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="paid">Paid</TabsTrigger>
              <TabsTrigger value="open">Open</TabsTrigger>
              <TabsTrigger value="void">Void</TabsTrigger>
            </TabsList>

            <TabsContent value={statusFilter} className="mt-6">
              {isInvoicesLoading ? (
                <Skeleton className="h-96 w-full" />
              ) : filteredInvoices.length > 0 ? (
                <InvoiceTable invoices={filteredInvoices} />
              ) : (
                <Alert>
                  <AlertDescription>
                    No {statusFilter !== 'all' ? statusFilter : ''} invoices found.
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>
          </Tabs>
      </div>
    </>
  );
}

