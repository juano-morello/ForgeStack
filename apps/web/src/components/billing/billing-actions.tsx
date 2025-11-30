'use client';

/**
 * Billing Actions Component
 *
 * Provides action buttons for managing billing:
 * - Manage Billing (opens Stripe portal)
 * - Cancel Subscription (with confirmation)
 * Only visible to organization owners.
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CreditCard, AlertTriangle } from 'lucide-react';
import type { Subscription } from '@/types/billing';

interface BillingActionsProps {
  subscription: Subscription | null;
  isOwner: boolean;
  onManageBilling: () => Promise<void>;
  isLoading?: boolean;
}

export function BillingActions({
  subscription,
  isOwner,
  onManageBilling,
  isLoading,
}: BillingActionsProps) {
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOwner) {
    return null;
  }

  const handleManageBilling = async () => {
    setIsProcessing(true);
    try {
      await onManageBilling();
    } catch (error) {
      console.error('Failed to open billing portal:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelSubscription = async () => {
    // The actual cancellation happens in the Stripe portal
    // This dialog just confirms the user wants to go there
    setShowCancelDialog(false);
    await handleManageBilling();
  };

  const hasActiveSubscription = subscription && subscription.status === 'active';

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Billing Management</CardTitle>
          <CardDescription>
            Manage your subscription, payment methods, and billing history
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              onClick={handleManageBilling}
              disabled={isLoading || isProcessing}
              className="flex-1"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              {isProcessing ? 'Opening...' : 'Manage Billing'}
            </Button>

            {hasActiveSubscription && !subscription.cancelAtPeriodEnd && (
              <Button
                variant="destructive"
                onClick={() => setShowCancelDialog(true)}
                disabled={isLoading || isProcessing}
                className="flex-1"
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                Cancel Subscription
              </Button>
            )}
          </div>

          <p className="text-xs text-muted-foreground">
            You will be redirected to Stripe&apos;s secure billing portal to manage your subscription.
          </p>
        </CardContent>
      </Card>

      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Subscription?</AlertDialogTitle>
            <AlertDialogDescription>
              You will be redirected to the billing portal where you can cancel your subscription.
              Your subscription will remain active until the end of the current billing period.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancelSubscription}>
              Continue to Portal
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

