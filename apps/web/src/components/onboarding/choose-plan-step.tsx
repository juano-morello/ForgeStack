/**
 * Choose Plan Step Component
 *
 * Step for selecting a subscription plan during onboarding.
 */

'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ChoosePlanStepProps {
  onNext: (planId: string) => void;
  onBack: () => void;
  onSkip: () => void;
}

const plans = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    features: ['1 project', '2 team members', 'Basic features'],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$29/mo',
    features: ['Unlimited projects', '10 team members', 'Advanced features'],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 'Custom',
    features: ['Unlimited everything', 'Priority support', 'Custom integrations'],
  },
];

export function ChoosePlanStep({ onNext, onBack, onSkip }: ChoosePlanStepProps) {
  const [selectedPlan, setSelectedPlan] = useState('free');

  return (
    <Card>
      <CardHeader>
        <CardTitle>Choose Your Plan</CardTitle>
        <CardDescription>Start free, upgrade anytime.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={cn(
                'p-4 border rounded-lg cursor-pointer transition-colors',
                selectedPlan === plan.id
                  ? 'border-primary bg-primary/5'
                  : 'hover:border-muted-foreground'
              )}
              onClick={() => setSelectedPlan(plan.id)}
            >
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold">{plan.name}</span>
                <span className="text-lg font-bold">{plan.price}</span>
              </div>
              <ul className="text-sm text-muted-foreground space-y-1">
                {plan.features.map((feature) => (
                  <li key={feature}>• {feature}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="ghost" onClick={onBack}>
          Back
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onSkip}>
            Decide Later
          </Button>
          <Button onClick={() => onNext(selectedPlan)}>
            Continue with {plans.find(p => p.id === selectedPlan)?.name}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}

