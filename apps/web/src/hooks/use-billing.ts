'use client';

/**
 * useBilling Hook
 *
 * Hook for managing billing and subscription state.
 * Provides methods to fetch subscription, start checkout, and open portal.
 */

import { useState, useCallback, useEffect } from 'react';
import { ApiError } from '@/lib/api';
import { getSubscription, createCheckout, createPortalSession } from '@/lib/api/billing';
import type { Subscription } from '@/types/billing';

interface UseBillingOptions {
  orgId: string;
  autoFetch?: boolean;
}

export function useBilling({ orgId, autoFetch = true }: UseBillingOptions) {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch subscription status
  const fetchSubscription = useCallback(async () => {
    if (!orgId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await getSubscription(orgId);
      setSubscription(data);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to fetch subscription';
      setError(message);
      console.error('Error fetching subscription:', err);
    } finally {
      setIsLoading(false);
    }
  }, [orgId]);

  // Start checkout flow
  const startCheckout = useCallback(async (priceId: string) => {
    if (!orgId) {
      throw new Error('Organization ID is required');
    }

    setError(null);
    
    try {
      const { checkoutUrl } = await createCheckout(orgId, priceId);
      // Redirect to Stripe Checkout
      window.location.href = checkoutUrl;
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to start checkout';
      setError(message);
      throw err;
    }
  }, [orgId]);

  // Open billing portal
  const openPortal = useCallback(async () => {
    if (!orgId) {
      throw new Error('Organization ID is required');
    }

    setError(null);
    
    try {
      const { portalUrl } = await createPortalSession(orgId);
      // Redirect to Stripe Portal
      window.location.href = portalUrl;
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to open billing portal';
      setError(message);
      throw err;
    }
  }, [orgId]);

  // Auto-fetch on mount if enabled
  useEffect(() => {
    if (autoFetch && orgId) {
      fetchSubscription();
    }
  }, [autoFetch, orgId, fetchSubscription]);

  return {
    subscription,
    isLoading,
    error,
    fetchSubscription,
    startCheckout,
    openPortal,
  };
}

