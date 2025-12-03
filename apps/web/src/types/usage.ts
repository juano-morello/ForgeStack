/**
 * Usage Types
 *
 * Type definitions for usage tracking and billing.
 */

export interface UsageMetric {
  type: 'api_calls' | 'storage_bytes' | 'active_seats';
  current: number;
  limit: number | null;
  percentage: number;
  periodStart: string;
  periodEnd: string;
}

export interface UsageSummary {
  apiCalls: UsageMetric;
  storage: UsageMetric;
  seats: UsageMetric;
  periodStart: string;
  periodEnd: string;
}

export interface UsageHistoryPoint {
  date: string;
  apiCalls: number;
  storage: number;
  seats: number;
}

export interface UsageHistory {
  data: UsageHistoryPoint[];
  periodStart: string;
  periodEnd: string;
}

export interface UsageLimit {
  metricType: string;
  limitValue: number;
  isHardLimit: boolean;
}

export interface Invoice {
  id: string;
  number: string | null;
  status: string;
  amountDue: number;
  amountPaid: number;
  currency: string;
  created: string;
  dueDate: string | null;
  paidAt: string | null;
  hostedInvoiceUrl: string | null;
  invoicePdf: string | null;
}

export interface InvoiceDetail extends Invoice {
  lines: {
    id: string;
    description: string | null;
    amount: number;
    quantity: number | null;
    unitAmount: number | null;
  }[];
}

export interface ProjectedInvoice {
  amountDue: number;
  currency: string;
  periodStart: string | null;
  periodEnd: string | null;
  lines: {
    description: string | null;
    amount: number;
    quantity: number | null;
    unitAmount: number | null;
  }[];
}

