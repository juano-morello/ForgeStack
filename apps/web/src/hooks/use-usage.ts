'use client';

/**
 * useUsage Hooks
 *
 * Hooks for managing usage and billing data.
 */

import { useState, useCallback, useEffect } from 'react';
import { ApiError } from '@/lib/api';
import {
  getUsageSummary as getUsageSummaryApi,
  getUsageHistory as getUsageHistoryApi,
  getUsageLimits as getUsageLimitsApi,
  getInvoices as getInvoicesApi,
  getInvoice as getInvoiceApi,
  getProjectedInvoice as getProjectedInvoiceApi,
} from '@/lib/api/usage';
import type {
  UsageSummary,
  UsageHistory,
  UsageLimit,
  Invoice,
  InvoiceDetail,
  ProjectedInvoice,
} from '@/types/usage';

interface UseUsageOptions {
  orgId: string;
  autoFetch?: boolean;
}

/**
 * Hook for usage summary
 */
export function useUsageSummary({ orgId, autoFetch = true }: UseUsageOptions) {
  const [data, setData] = useState<UsageSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!orgId) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await getUsageSummaryApi(orgId);
      setData(result);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to fetch usage summary';
      setError(message);
      console.error('Error fetching usage summary:', err);
    } finally {
      setIsLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    if (autoFetch && orgId) {
      fetch();
    }
  }, [autoFetch, orgId, fetch]);

  return { data, isLoading, error, refetch: fetch };
}

/**
 * Hook for usage history
 */
export function useUsageHistory({ orgId, autoFetch = true }: UseUsageOptions, months?: number) {
  const [data, setData] = useState<UsageHistory | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!orgId) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await getUsageHistoryApi(orgId, months);
      setData(result);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to fetch usage history';
      setError(message);
      console.error('Error fetching usage history:', err);
    } finally {
      setIsLoading(false);
    }
  }, [orgId, months]);

  useEffect(() => {
    if (autoFetch && orgId) {
      fetch();
    }
  }, [autoFetch, orgId, fetch]);

  return { data, isLoading, error, refetch: fetch };
}

/**
 * Hook for usage limits
 */
export function useUsageLimits({ orgId, autoFetch = true }: UseUsageOptions) {
  const [data, setData] = useState<UsageLimit[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!orgId) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await getUsageLimitsApi(orgId);
      setData(result);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to fetch usage limits';
      setError(message);
      console.error('Error fetching usage limits:', err);
    } finally {
      setIsLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    if (autoFetch && orgId) {
      fetch();
    }
  }, [autoFetch, orgId, fetch]);

  return { data, isLoading, error, refetch: fetch };
}

/**
 * Hook for invoices list
 */
export function useInvoices({ orgId, autoFetch = true }: UseUsageOptions) {
  const [data, setData] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!orgId) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await getInvoicesApi(orgId);
      setData(result);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to fetch invoices';
      setError(message);
      console.error('Error fetching invoices:', err);
    } finally {
      setIsLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    if (autoFetch && orgId) {
      fetch();
    }
  }, [autoFetch, orgId, fetch]);

  return { data, isLoading, error, refetch: fetch };
}

/**
 * Hook for single invoice
 */
export function useInvoice(orgId: string, invoiceId: string | null) {
  const [data, setData] = useState<InvoiceDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!orgId || !invoiceId) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await getInvoiceApi(orgId, invoiceId);
      setData(result);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to fetch invoice';
      setError(message);
      console.error('Error fetching invoice:', err);
    } finally {
      setIsLoading(false);
    }
  }, [orgId, invoiceId]);

  useEffect(() => {
    if (orgId && invoiceId) {
      fetch();
    }
  }, [orgId, invoiceId, fetch]);

  return { data, isLoading, error, refetch: fetch };
}

/**
 * Hook for projected invoice
 */
export function useProjectedInvoice({ orgId, autoFetch = true }: UseUsageOptions) {
  const [data, setData] = useState<ProjectedInvoice | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!orgId) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await getProjectedInvoiceApi(orgId);
      setData(result);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to fetch projected invoice';
      setError(message);
      console.error('Error fetching projected invoice:', err);
    } finally {
      setIsLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    if (autoFetch && orgId) {
      fetch();
    }
  }, [autoFetch, orgId, fetch]);

  return { data, isLoading, error, refetch: fetch };
}

