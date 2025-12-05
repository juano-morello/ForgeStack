'use client';

/**
 * Organization Features Page
 *
 * Displays features available for the current organization.
 */

import { useOrgContext } from '@/components/providers/org-provider';
import { useFeaturesWithStatus } from '@/hooks/use-feature-flags';
import { PageHeader } from '@/components/layout/page-header';
import { EnabledFeaturesCard } from '@/components/feature-flags/enabled-features-card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { ShieldAlert, ArrowUpCircle } from 'lucide-react';
import Link from 'next/link';

export default function OrganizationFeaturesPage() {
  const { currentOrg } = useOrgContext();
  const { features, isLoading, error } = useFeaturesWithStatus({
    orgId: currentOrg?.id || '',
    autoFetch: !!currentOrg?.id,
  });

  if (!currentOrg) {
    return (
      <Alert variant="destructive">
        <ShieldAlert className="h-4 w-4" />
        <AlertDescription>Please select an organization to continue.</AlertDescription>
      </Alert>
    );
  }

  const enabledFeatures = features.filter((f) => f.enabled);
  const disabledFeatures = features.filter((f) => !f.enabled);
  const planGatedFeatures = disabledFeatures.filter((f) => f.requiredPlan);

  return (
    <>
      <PageHeader
        title="Features"
        description={`Features available for ${currentOrg.name}`}
      />

      <div className="space-y-6">
          {/* Upgrade prompt if there are plan-gated features */}
          {planGatedFeatures.length > 0 && (
            <Alert>
              <ArrowUpCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="flex items-center justify-between">
                  <span>
                    Unlock {planGatedFeatures.length} additional feature
                    {planGatedFeatures.length > 1 ? 's' : ''} by upgrading your plan.
                  </span>
                  <Button asChild size="sm" className="ml-4">
                    <Link href="/settings/billing">Upgrade Plan</Link>
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Features Card */}
          <EnabledFeaturesCard features={features} isLoading={isLoading} error={error} />

          {/* Feature Summary */}
          {!isLoading && !error && features.length > 0 && (
            <div className="rounded-lg border p-4 bg-muted/50">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-primary">{enabledFeatures.length}</div>
                  <div className="text-sm text-muted-foreground">Enabled</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-muted-foreground">
                    {disabledFeatures.length}
                  </div>
                  <div className="text-sm text-muted-foreground">Disabled</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-orange-600">
                    {planGatedFeatures.length}
                  </div>
                  <div className="text-sm text-muted-foreground">Requires Upgrade</div>
                </div>
              </div>
            </div>
          )}
      </div>
    </>
  );
}

