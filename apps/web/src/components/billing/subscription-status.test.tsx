/**
 * SubscriptionStatus Component Tests
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SubscriptionStatus } from './subscription-status';
import type { Subscription } from '@/types/billing';

describe('SubscriptionStatus', () => {
  const mockSubscription: Subscription = {
    id: 'sub_123',
    plan: 'pro',
    status: 'active',
    currentPeriodStart: '2024-01-01T00:00:00.000Z',
    currentPeriodEnd: '2024-02-01T00:00:00.000Z',
    cancelAtPeriodEnd: false,
  };

  it('renders loading state', () => {
    render(<SubscriptionStatus subscription={null} isLoading={true} />);
    expect(screen.getByText('Current Plan')).toBeInTheDocument();
    expect(screen.getByText('Loading subscription information...')).toBeInTheDocument();
  });

  it('renders free plan when no subscription', () => {
    render(<SubscriptionStatus subscription={null} isLoading={false} />);
    expect(screen.getByText('Free Plan')).toBeInTheDocument();
    expect(screen.getByText(/You are currently on the free plan/)).toBeInTheDocument();
  });

  it('renders subscription information correctly', () => {
    render(<SubscriptionStatus subscription={mockSubscription} isLoading={false} />);
    expect(screen.getByText('Pro Plan')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('shows correct status badge for active subscription', () => {
    render(<SubscriptionStatus subscription={mockSubscription} isLoading={false} />);
    const badge = screen.getByText('Active');
    expect(badge).toBeInTheDocument();
  });

  it('shows past due warning for past_due status', () => {
    const pastDueSubscription: Subscription = {
      ...mockSubscription,
      status: 'past_due',
    };
    render(<SubscriptionStatus subscription={pastDueSubscription} isLoading={false} />);
    expect(screen.getByText(/Your payment is past due/)).toBeInTheDocument();
  });

  it('shows cancellation notice when cancelAtPeriodEnd is true', () => {
    const cancelingSubscription: Subscription = {
      ...mockSubscription,
      cancelAtPeriodEnd: true,
    };
    render(<SubscriptionStatus subscription={cancelingSubscription} isLoading={false} />);
    expect(screen.getByText(/will be canceled at the end/)).toBeInTheDocument();
  });

  it('displays renewal date for active subscription', () => {
    render(<SubscriptionStatus subscription={mockSubscription} isLoading={false} />);
    expect(screen.getByText(/Renews on/)).toBeInTheDocument();
  });

  it('displays expiry date when subscription is canceling', () => {
    const cancelingSubscription: Subscription = {
      ...mockSubscription,
      cancelAtPeriodEnd: true,
    };
    render(<SubscriptionStatus subscription={cancelingSubscription} isLoading={false} />);
    expect(screen.getByText(/Expires on/)).toBeInTheDocument();
  });

  it('capitalizes plan name correctly', () => {
    const basicSubscription: Subscription = {
      ...mockSubscription,
      plan: 'basic',
    };
    render(<SubscriptionStatus subscription={basicSubscription} isLoading={false} />);
    expect(screen.getByText('Basic Plan')).toBeInTheDocument();
  });

  it('shows correct status label for trialing', () => {
    const trialingSubscription: Subscription = {
      ...mockSubscription,
      status: 'trialing',
    };
    render(<SubscriptionStatus subscription={trialingSubscription} isLoading={false} />);
    expect(screen.getByText('Trial')).toBeInTheDocument();
  });

  it('shows correct status label for canceled', () => {
    const canceledSubscription: Subscription = {
      ...mockSubscription,
      status: 'canceled',
    };
    render(<SubscriptionStatus subscription={canceledSubscription} isLoading={false} />);
    expect(screen.getByText('Canceled')).toBeInTheDocument();
  });
});

