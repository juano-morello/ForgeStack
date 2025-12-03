/**
 * useBilling Hook Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useBilling } from './use-billing';
import * as billingApi from '@/lib/api/billing';
import type { Subscription } from '@/types/billing';

vi.mock('@/lib/api/billing');

describe('useBilling', () => {
  const mockOrgId = 'org_123';
  const mockSubscription: Subscription = {
    id: 'sub_123',
    plan: 'pro',
    status: 'active',
    currentPeriodStart: '2024-01-01T00:00:00.000Z',
    currentPeriodEnd: '2024-02-01T00:00:00.000Z',
    cancelAtPeriodEnd: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock window.location.href
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (window as any).location;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).location = { href: '' };
  });

  it('fetches subscription on mount when autoFetch is true', async () => {
    vi.mocked(billingApi.getSubscription).mockResolvedValue(mockSubscription);

    const { result } = renderHook(() =>
      useBilling({ orgId: mockOrgId, autoFetch: true })
    );

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(billingApi.getSubscription).toHaveBeenCalledWith(mockOrgId);
    expect(result.current.subscription).toEqual(mockSubscription);
    expect(result.current.error).toBeNull();
  });

  it('does not fetch subscription when autoFetch is false', () => {
    vi.mocked(billingApi.getSubscription).mockResolvedValue(mockSubscription);

    renderHook(() => useBilling({ orgId: mockOrgId, autoFetch: false }));

    expect(billingApi.getSubscription).not.toHaveBeenCalled();
  });

  it('handles fetch subscription error', async () => {
    const error = new Error('Failed to fetch');
    vi.mocked(billingApi.getSubscription).mockRejectedValue(error);

    const { result } = renderHook(() =>
      useBilling({ orgId: mockOrgId, autoFetch: true })
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('Failed to fetch subscription');
    expect(result.current.subscription).toBeNull();
  });

  it('startCheckout redirects to checkout URL', async () => {
    const mockCheckoutResponse = {
      checkoutUrl: 'https://checkout.stripe.com/session_123',
      sessionId: 'session_123',
    };
    vi.mocked(billingApi.createCheckout).mockResolvedValue(mockCheckoutResponse);

    const { result } = renderHook(() =>
      useBilling({ orgId: mockOrgId, autoFetch: false })
    );

    await result.current.startCheckout('price_123');

    expect(billingApi.createCheckout).toHaveBeenCalledWith(mockOrgId, 'price_123');
    expect(window.location.href).toBe(mockCheckoutResponse.checkoutUrl);
  });

  it('startCheckout throws error when orgId is missing', async () => {
    const { result } = renderHook(() =>
      useBilling({ orgId: '', autoFetch: false })
    );

    await expect(result.current.startCheckout('price_123')).rejects.toThrow(
      'Organization ID is required'
    );
  });

  it('startCheckout handles API error', async () => {
    const error = new Error('Checkout failed');
    vi.mocked(billingApi.createCheckout).mockRejectedValue(error);

    const { result } = renderHook(() =>
      useBilling({ orgId: mockOrgId, autoFetch: false })
    );

    await expect(result.current.startCheckout('price_123')).rejects.toThrow();

    await waitFor(() => {
      expect(result.current.error).toBe('Failed to start checkout');
    });
  });

  it('openPortal redirects to portal URL', async () => {
    const mockPortalResponse = {
      portalUrl: 'https://billing.stripe.com/portal_123',
    };
    vi.mocked(billingApi.createPortalSession).mockResolvedValue(mockPortalResponse);

    const { result } = renderHook(() =>
      useBilling({ orgId: mockOrgId, autoFetch: false })
    );

    await result.current.openPortal();

    expect(billingApi.createPortalSession).toHaveBeenCalledWith(mockOrgId);
    expect(window.location.href).toBe(mockPortalResponse.portalUrl);
  });

  it('openPortal throws error when orgId is missing', async () => {
    const { result } = renderHook(() =>
      useBilling({ orgId: '', autoFetch: false })
    );

    await expect(result.current.openPortal()).rejects.toThrow(
      'Organization ID is required'
    );
  });

  it('openPortal handles API error', async () => {
    const error = new Error('Portal failed');
    vi.mocked(billingApi.createPortalSession).mockRejectedValue(error);

    const { result } = renderHook(() =>
      useBilling({ orgId: mockOrgId, autoFetch: false })
    );

    await expect(result.current.openPortal()).rejects.toThrow();

    await waitFor(() => {
      expect(result.current.error).toBe('Failed to open billing portal');
    });
  });

  it('fetchSubscription can be called manually', async () => {
    vi.mocked(billingApi.getSubscription).mockResolvedValue(mockSubscription);

    const { result } = renderHook(() =>
      useBilling({ orgId: mockOrgId, autoFetch: false })
    );

    expect(billingApi.getSubscription).not.toHaveBeenCalled();

    await result.current.fetchSubscription();

    await waitFor(() => {
      expect(result.current.subscription).toEqual(mockSubscription);
    });

    expect(billingApi.getSubscription).toHaveBeenCalledWith(mockOrgId);
  });
});

