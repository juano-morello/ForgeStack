'use client';

/**
 * Billing Settings Page
 *
 * Displays subscription status, available plans, and billing management options.
 * Only organization owners can perform billing actions.
 */

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useOrgContext } from '@/components/providers/org-provider';
import { useBilling } from '@/hooks/use-billing';
import { useUsageSummary, useUsageHistory, useProjectedInvoice, useInvoices } from '@/hooks/use-usage';
import { PageHeader } from '@/components/layout/page-header';
import { SubscriptionStatus } from '@/components/billing/subscription-status';
import { PlanSelector } from '@/components/billing/plan-selector';
import { BillingActions } from '@/components/billing/billing-actions';
import { UsageSummaryCards } from '@/components/usage/usage-summary-cards';
import { UsageChart } from '@/components/usage/usage-chart';
import { UsageLimitAlert } from '@/components/usage/usage-limit-alert';
import { ProjectedInvoiceCard } from '@/components/usage/projected-invoice-card';
import { InvoiceTable } from '@/components/usage/invoice-table';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { XCircle, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function BillingPage() {
  const { currentOrg, isLoading: isOrgLoading } = useOrgContext();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const {
    subscription,
    isLoading: isBillingLoading,
    error,
    fetchSubscription,
    startCheckout,
    openPortal,
  } = useBilling({
    orgId: currentOrg?.id || '',
    autoFetch: !!currentOrg?.id,
  });

  const { data: usageSummary, isLoading: isUsageLoading } = useUsageSummary({
    orgId: currentOrg?.id || '',
    autoFetch: !!currentOrg?.id,
  });

  const { data: usageHistory, isLoading: isHistoryLoading } = useUsageHistory({
    orgId: currentOrg?.id || '',
    autoFetch: !!currentOrg?.id,
  }, 1); // Last 30 days

  const { data: projectedInvoice, isLoading: isProjectedLoading } = useProjectedInvoice({
    orgId: currentOrg?.id || '',
    autoFetch: !!currentOrg?.id,
  });

  const { data: invoices, isLoading: isInvoicesLoading } = useInvoices({
    orgId: currentOrg?.id || '',
    autoFetch: !!currentOrg?.id,
  });

  const isOwner = currentOrg?.role === 'OWNER';
  const isLoading = isOrgLoading || isBillingLoading;

  // Handle success/cancel query params from Stripe redirect
  useEffect(() => {
    const success = searchParams.get('success');
    const canceled = searchParams.get('canceled');

    if (success === 'true') {
      toast({
        title: 'Subscription Updated',
        description: 'Your subscription has been successfully updated.',
      });
      // Refresh subscription data
      fetchSubscription();
    } else if (canceled === 'true') {
      toast({
        title: 'Checkout Canceled',
        description: 'You canceled the checkout process.',
        variant: 'destructive',
      });
    }
  }, [searchParams, toast, fetchSubscription]);

  if (isOrgLoading) {
    return (
      <>
        <PageHeader
          title="Billing & Subscription"
          description="Loading..."
        />
        <div className="space-y-6">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </>
    );
  }

  if (!currentOrg) {
    return (
      <Alert variant="destructive">
        <XCircle className="h-4 w-4" />
        <AlertDescription>
          Please select an organization to view billing settings.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <>
      <PageHeader
        title="Billing & Subscription"
        description={`Manage billing for ${currentOrg.name}`}
      />

      <div className="space-y-8">
          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Subscription Status */}
          <SubscriptionStatus subscription={subscription} isLoading={isBillingLoading} />

          {/* Usage Limit Alerts */}
          {usageSummary && <UsageLimitAlert summary={usageSummary} />}

          {/* Usage Summary */}
          <div>
            <h2 className="text-2xl font-bold mb-4">Current Usage</h2>
            {isUsageLoading ? (
              <div className="grid gap-4 md:grid-cols-3">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
              </div>
            ) : usageSummary ? (
              <UsageSummaryCards summary={usageSummary} />
            ) : (
              <Alert>
                <AlertDescription>
                  Usage data is not available at this time.
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Usage Chart */}
          {usageHistory && usageHistory.data.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold mb-4">Usage Trends (Last 30 Days)</h2>
              {isHistoryLoading ? (
                <Skeleton className="h-80 w-full" />
              ) : (
                <UsageChart history={usageHistory} />
              )}
            </div>
          )}

          {/* Projected Invoice */}
          {projectedInvoice && (
            <div>
              <h2 className="text-2xl font-bold mb-4">Projected Invoice</h2>
              {isProjectedLoading ? (
                <Skeleton className="h-64 w-full" />
              ) : (
                <ProjectedInvoiceCard invoice={projectedInvoice} />
              )}
            </div>
          )}

          {/* Recent Invoices */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Recent Invoices</h2>
              {invoices.length > 0 && (
                <Button variant="outline" asChild>
                  <Link href="/settings/billing/invoices">
                    View All
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              )}
            </div>
            {isInvoicesLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : invoices.length > 0 ? (
              <InvoiceTable invoices={invoices} maxRows={5} />
            ) : (
              <Alert>
                <AlertDescription>
                  No invoices found.
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Plan Selector */}
          <div>
            <h2 className="text-2xl font-bold mb-4">Available Plans</h2>
            <PlanSelector
              currentPlan={subscription?.plan || 'free'}
              onSelectPlan={startCheckout}
              isLoading={isLoading}
            />
          </div>

          {/* Billing Actions (Owner Only) */}
          {isOwner && (
            <BillingActions
              subscription={subscription}
              isOwner={isOwner}
              onManageBilling={openPortal}
              isLoading={isLoading}
            />
          )}

          {/* Non-Owner Message */}
          {!isOwner && (
            <Alert>
              <AlertDescription>
                Only organization owners can manage billing and subscriptions.
              </AlertDescription>
            </Alert>
          )}
      </div>
    </>
  );
}

