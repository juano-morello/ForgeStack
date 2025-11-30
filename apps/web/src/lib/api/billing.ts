/**
 * Billing API Client
 *
 * API functions for billing and subscription management.
 */

import { api } from '@/lib/api';
import type { Subscription, CheckoutResponse, PortalResponse } from '@/types/billing';

/**
 * Get the current subscription for an organization
 */
export async function getSubscription(_orgId: string): Promise<Subscription | null> {
  try {
    const response = await api.get<{ subscription: Subscription | null }>('/billing/subscription');
    return response.subscription;
  } catch (error) {
    console.error('Failed to fetch subscription:', error);
    throw error;
  }
}

/**
 * Create a Stripe Checkout session for subscribing to a plan
 */
export async function createCheckout(
  orgId: string,
  priceId: string
): Promise<CheckoutResponse> {
  try {
    const response = await api.post<CheckoutResponse>('/billing/checkout', {
      priceId,
      successUrl: `${window.location.origin}/settings/billing?success=true`,
      cancelUrl: `${window.location.origin}/settings/billing?canceled=true`,
    });
    return response;
  } catch (error) {
    console.error('Failed to create checkout session:', error);
    throw error;
  }
}

/**
 * Create a Stripe billing portal session
 */
export async function createPortalSession(_orgId: string): Promise<PortalResponse> {
  try {
    const response = await api.post<PortalResponse>('/billing/portal', {
      returnUrl: `${window.location.origin}/settings/billing`,
    });
    return response;
  } catch (error) {
    console.error('Failed to create portal session:', error);
    throw error;
  }
}

