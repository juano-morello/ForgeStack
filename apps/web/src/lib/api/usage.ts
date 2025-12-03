/**
 * Usage API Client
 *
 * API functions for usage tracking and billing.
 */

import { api } from '@/lib/api';
import type {
  UsageSummary,
  UsageHistory,
  UsageMetric,
  UsageLimit,
  Invoice,
  InvoiceDetail,
  ProjectedInvoice,
} from '@/types/usage';

/**
 * Get current period usage summary
 */
export async function getUsageSummary(_orgId: string): Promise<UsageSummary> {
  try {
    const response = await api.get<UsageSummary>('/billing/usage');
    return response;
  } catch (error) {
    console.error('Failed to fetch usage summary:', error);
    throw error;
  }
}

/**
 * Get historical usage data
 */
export async function getUsageHistory(
  _orgId: string,
  months?: number
): Promise<UsageHistory> {
  try {
    const endpoint = months
      ? `/billing/usage/history?months=${months}`
      : '/billing/usage/history';
    const response = await api.get<UsageHistory>(endpoint);
    return response;
  } catch (error) {
    console.error('Failed to fetch usage history:', error);
    throw error;
  }
}

/**
 * Get detailed API call breakdown
 */
export async function getApiCallsUsage(_orgId: string): Promise<UsageMetric> {
  try {
    const response = await api.get<UsageMetric>('/billing/usage/api-calls');
    return response;
  } catch (error) {
    console.error('Failed to fetch API calls usage:', error);
    throw error;
  }
}

/**
 * Get storage usage details
 */
export async function getStorageUsage(_orgId: string): Promise<UsageMetric> {
  try {
    const response = await api.get<UsageMetric>('/billing/usage/storage');
    return response;
  } catch (error) {
    console.error('Failed to fetch storage usage:', error);
    throw error;
  }
}

/**
 * Get active seats details
 */
export async function getSeatsUsage(_orgId: string): Promise<UsageMetric> {
  try {
    const response = await api.get<UsageMetric>('/billing/usage/seats');
    return response;
  } catch (error) {
    console.error('Failed to fetch seats usage:', error);
    throw error;
  }
}

/**
 * Get current usage limits
 */
export async function getUsageLimits(_orgId: string): Promise<UsageLimit[]> {
  try {
    const response = await api.get<UsageLimit[]>('/billing/limits');
    return response;
  } catch (error) {
    console.error('Failed to fetch usage limits:', error);
    throw error;
  }
}

/**
 * List organization invoices
 */
export async function getInvoices(_orgId: string): Promise<Invoice[]> {
  try {
    const response = await api.get<Invoice[]>('/billing/invoices');
    return response;
  } catch (error) {
    console.error('Failed to fetch invoices:', error);
    throw error;
  }
}

/**
 * Get invoice details
 */
export async function getInvoice(_orgId: string, id: string): Promise<InvoiceDetail> {
  try {
    const response = await api.get<InvoiceDetail>(`/billing/invoices/${id}`);
    return response;
  } catch (error) {
    console.error('Failed to fetch invoice:', error);
    throw error;
  }
}

/**
 * Get projected invoice for current period
 */
export async function getProjectedInvoice(_orgId: string): Promise<ProjectedInvoice> {
  try {
    const response = await api.get<ProjectedInvoice>('/billing/projected-invoice');
    return response;
  } catch (error) {
    console.error('Failed to fetch projected invoice:', error);
    throw error;
  }
}

