'use client';

/**
 * Plan Selector Component
 *
 * Displays available subscription plans with features and pricing.
 * Allows users to select and subscribe to a plan.
 */

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check } from 'lucide-react';
import type { Subscription, PlanInfo } from '@/types/billing';
import { cn } from '@/lib/utils';

interface PlanSelectorProps {
  currentPlan?: Subscription['plan'];
  onSelectPlan: (priceId: string) => Promise<void>;
  isLoading?: boolean;
}

// Plan configurations
const PLANS: PlanInfo[] = [
  {
    id: 'basic',
    name: 'Basic',
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_BASIC || 'price_basic',
    price: 29,
    interval: 'month',
    features: [
      'Up to 10 projects',
      'Up to 5 team members',
      'Basic analytics',
      'Email support',
      '10GB storage',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO || 'price_pro',
    price: 99,
    interval: 'month',
    features: [
      'Unlimited projects',
      'Unlimited team members',
      'Advanced analytics',
      'Priority support',
      '100GB storage',
      'Custom integrations',
      'API access',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_ENTERPRISE || 'price_enterprise',
    price: 299,
    interval: 'month',
    features: [
      'Everything in Pro',
      'Dedicated support',
      'Custom SLA',
      'Unlimited storage',
      'Advanced security',
      'SSO integration',
      'Custom contracts',
    ],
  },
];

export function PlanSelector({ currentPlan = 'free', onSelectPlan, isLoading }: PlanSelectorProps) {
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  const handleSelectPlan = async (plan: PlanInfo) => {
    if (plan.id === currentPlan) return;
    
    setSelectedPlanId(plan.id);
    try {
      await onSelectPlan(plan.priceId);
    } catch (error) {
      console.error('Failed to select plan:', error);
    } finally {
      setSelectedPlanId(null);
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {PLANS.map((plan) => {
        const isCurrent = plan.id === currentPlan;
        const isSelecting = selectedPlanId === plan.id;
        const isPopular = plan.id === 'pro';

        return (
          <Card
            key={plan.id}
            className={cn(
              'relative transition-all',
              isCurrent && 'ring-2 ring-primary',
              isPopular && 'border-primary'
            )}
          >
            {isPopular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge>Most Popular</Badge>
              </div>
            )}
            
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {plan.name}
                {isCurrent && <Badge variant="secondary">Current</Badge>}
              </CardTitle>
              <CardDescription>
                <span className="text-3xl font-bold text-foreground">${plan.price}</span>
                <span className="text-muted-foreground">/{plan.interval}</span>
              </CardDescription>
            </CardHeader>

            <CardContent>
              <ul className="space-y-2">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>

            <CardFooter>
              <Button
                className="w-full"
                variant={isCurrent ? 'outline' : 'default'}
                disabled={isCurrent || isLoading || isSelecting}
                onClick={() => handleSelectPlan(plan)}
              >
                {isSelecting ? 'Processing...' : isCurrent ? 'Current Plan' : 'Select Plan'}
              </Button>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}

