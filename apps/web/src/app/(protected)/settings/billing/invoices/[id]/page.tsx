'use client';

/**
 * Invoice Detail Page
 *
 * Displays detailed information about a specific invoice.
 */

import { use } from 'react';
import Link from 'next/link';
import { useOrgContext } from '@/components/providers/org-provider';
import { useInvoice } from '@/hooks/use-usage';
import { ProtectedHeader } from '@/components/layout/protected-header';
import { PageHeader } from '@/components/layout/page-header';
import { InvoiceDetail } from '@/components/usage/invoice-detail';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { XCircle, ArrowLeft } from 'lucide-react';

interface InvoiceDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function InvoiceDetailPage({ params }: InvoiceDetailPageProps) {
  const { id } = use(params);
  const { currentOrg, isLoading: isOrgLoading } = useOrgContext();

  const { data: invoice, isLoading: isInvoiceLoading, error } = useInvoice(
    currentOrg?.id || '',
    id
  );

  const isOwner = currentOrg?.role === 'OWNER';

  if (isOrgLoading) {
    return (
      <div className="min-h-screen bg-background">
        <ProtectedHeader />
        <main className="container mx-auto py-6 px-4 sm:px-6 lg:px-8 max-w-6xl">
          <PageHeader
            title="Invoice Details"
            description="Loading..."
          />
          <Skeleton className="h-96 w-full" />
        </main>
      </div>
    );
  }

  if (!currentOrg) {
    return (
      <div className="min-h-screen bg-background">
        <ProtectedHeader />
        <main className="container mx-auto py-6 px-4 sm:px-6 lg:px-8 max-w-6xl">
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              Please select an organization to view invoice details.
            </AlertDescription>
          </Alert>
        </main>
      </div>
    );
  }

  if (!isOwner) {
    return (
      <div className="min-h-screen bg-background">
        <ProtectedHeader />
        <main className="container mx-auto py-6 px-4 sm:px-6 lg:px-8 max-w-6xl">
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              Only organization owners can view invoice details.
            </AlertDescription>
          </Alert>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <ProtectedHeader />
      <main className="container mx-auto py-6 px-4 sm:px-6 lg:px-8 max-w-6xl">
        <div className="mb-6">
          <Button variant="ghost" asChild>
            <Link href="/settings/billing/invoices">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Invoices
            </Link>
          </Button>
        </div>

        <PageHeader
          title="Invoice Details"
          description={`Invoice for ${currentOrg.name}`}
        />

        <div className="mt-8">
          {error && (
            <Alert variant="destructive" className="mb-6">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {isInvoiceLoading ? (
            <Skeleton className="h-96 w-full" />
          ) : invoice ? (
            <InvoiceDetail invoice={invoice} />
          ) : (
            <Alert>
              <AlertDescription>
                Invoice not found.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </main>
    </div>
  );
}

