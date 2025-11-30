'use client';

/**
 * Billing Settings Page
 *
 * Displays subscription status, available plans, and billing management options.
 * Only organization owners can perform billing actions.
 */

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useOrgContext } from '@/components/providers/org-provider';
import { useBilling } from '@/hooks/use-billing';
import { ProtectedHeader } from '@/components/layout/protected-header';
import { PageHeader } from '@/components/layout/page-header';
import { SubscriptionStatus } from '@/components/billing/subscription-status';
import { PlanSelector } from '@/components/billing/plan-selector';
import { BillingActions } from '@/components/billing/billing-actions';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { XCircle } from 'lucide-react';
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
      <div className="min-h-screen bg-background">
        <ProtectedHeader />
        <main className="container mx-auto py-6 px-4 sm:px-6 lg:px-8 max-w-6xl">
          <PageHeader
            title="Billing & Subscription"
            description="Loading..."
          />
          <div className="space-y-6">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-96 w-full" />
          </div>
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
              Please select an organization to view billing settings.
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
      </main>
    </div>
  );
}

