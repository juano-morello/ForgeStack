/**
 * Audit Logs API Client
 *
 * API functions for audit log management.
 */

import { api } from '@/lib/api';
import type {
  AuditLog,
  AuditLogFilters,
  AuditLogStats,
  AuditLogsResponse,
} from '@/types/audit-logs';

/**
 * List audit logs with pagination and filters
 */
export async function listAuditLogs(
  orgId: string,
  filters?: AuditLogFilters
): Promise<AuditLogsResponse> {
  try {
    const params = new URLSearchParams();
    
    if (filters?.page) params.append('page', String(filters.page));
    if (filters?.limit) params.append('limit', String(filters.limit));
    if (filters?.action) params.append('action', filters.action);
    if (filters?.resourceType) params.append('resource_type', filters.resourceType);
    if (filters?.actorId) params.append('actor_id', filters.actorId);
    if (filters?.actorEmail) params.append('actor_email', filters.actorEmail);
    if (filters?.dateFrom) params.append('start_date', filters.dateFrom);
    if (filters?.dateTo) params.append('end_date', filters.dateTo);

    const queryString = params.toString();
    const endpoint = queryString ? `/audit-logs?${queryString}` : '/audit-logs';

    const response = await api.get<AuditLogsResponse>(endpoint);
    return response;
  } catch (error) {
    console.error('Failed to list audit logs:', error);
    throw error;
  }
}

/**
 * Get a single audit log entry
 */
export async function getAuditLog(
  orgId: string,
  logId: string
): Promise<AuditLog> {
  try {
    const response = await api.get<AuditLog>(`/audit-logs/${logId}`);
    return response;
  } catch (error) {
    console.error('Failed to get audit log:', error);
    throw error;
  }
}

/**
 * Get audit log statistics
 */
export async function getAuditLogStats(
  orgId: string,
  filters?: AuditLogFilters
): Promise<AuditLogStats> {
  try {
    const params = new URLSearchParams();
    
    if (filters?.dateFrom) params.append('start_date', filters.dateFrom);
    if (filters?.dateTo) params.append('end_date', filters.dateTo);
    if (filters?.action) params.append('action', filters.action);
    if (filters?.resourceType) params.append('resource_type', filters.resourceType);

    const queryString = params.toString();
    const endpoint = queryString ? `/audit-logs/stats?${queryString}` : '/audit-logs/stats';

    const response = await api.get<AuditLogStats>(endpoint);
    return response;
  } catch (error) {
    console.error('Failed to get audit log stats:', error);
    throw error;
  }
}

/**
 * Export audit logs as CSV or JSON
 */
export async function exportAuditLogs(
  orgId: string,
  filters?: AuditLogFilters,
  format: 'json' | 'csv' = 'csv'
): Promise<Blob> {
  try {
    const params = new URLSearchParams();
    params.append('format', format);
    
    if (filters?.action) params.append('action', filters.action);
    if (filters?.resourceType) params.append('resource_type', filters.resourceType);
    if (filters?.actorId) params.append('actor_id', filters.actorId);
    if (filters?.actorEmail) params.append('actor_email', filters.actorEmail);
    if (filters?.dateFrom) params.append('start_date', filters.dateFrom);
    if (filters?.dateTo) params.append('end_date', filters.dateTo);

    const queryString = params.toString();
    const endpoint = `/audit-logs/export?${queryString}`;

    // Use fetch directly for blob response
    const orgIdFromStorage = typeof window !== 'undefined' 
      ? localStorage.getItem('currentOrgId') 
      : null;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (orgIdFromStorage) {
      (headers as Record<string, string>)['X-Org-Id'] = orgIdFromStorage;
    }

    const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
    const res = await fetch(`${API_BASE}${endpoint}`, {
      headers,
      credentials: 'include',
    });

    if (!res.ok) {
      throw new Error(`Export failed: ${res.status}`);
    }

    return await res.blob();
  } catch (error) {
    console.error('Failed to export audit logs:', error);
    throw error;
  }
}

