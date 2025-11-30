'use client';

/**
 * Subscription Status Component
 *
 * Displays the current subscription plan, status, and renewal information.
 * Shows warning alerts for past_due status.
 */

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar, AlertTriangle } from 'lucide-react';
import type { Subscription } from '@/types/billing';

interface SubscriptionStatusProps {
  subscription: Subscription | null;
  isLoading?: boolean;
}

export function SubscriptionStatus({ subscription, isLoading }: SubscriptionStatusProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Current Plan</CardTitle>
          <CardDescription>Loading subscription information...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!subscription) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Current Plan</CardTitle>
          <CardDescription>Free Plan</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            You are currently on the free plan. Upgrade to unlock premium features.
          </p>
        </CardContent>
      </Card>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusVariant = (status: Subscription['status']) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'trialing':
        return 'secondary';
      case 'past_due':
      case 'unpaid':
        return 'destructive';
      case 'canceled':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getStatusLabel = (status: Subscription['status']) => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'trialing':
        return 'Trial';
      case 'past_due':
        return 'Past Due';
      case 'unpaid':
        return 'Unpaid';
      case 'canceled':
        return 'Canceled';
      default:
        return status;
    }
  };

  const getPlanName = (plan: Subscription['plan']) => {
    return plan.charAt(0).toUpperCase() + plan.slice(1);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{getPlanName(subscription.plan)} Plan</CardTitle>
            <CardDescription className="flex items-center gap-2 mt-1">
              <Badge variant={getStatusVariant(subscription.status)}>
                {getStatusLabel(subscription.status)}
              </Badge>
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {subscription.status === 'past_due' && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Your payment is past due. Please update your payment method to avoid service interruption.
            </AlertDescription>
          </Alert>
        )}

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>
            {subscription.cancelAtPeriodEnd
              ? `Expires on ${formatDate(subscription.currentPeriodEnd)}`
              : `Renews on ${formatDate(subscription.currentPeriodEnd)}`}
          </span>
        </div>

        {subscription.cancelAtPeriodEnd && (
          <Alert>
            <AlertDescription>
              Your subscription will be canceled at the end of the current billing period.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

