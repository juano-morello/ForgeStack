/**
 * Admin API Client
 *
 * API functions for super-admin operations.
 */

import { api } from '@/lib/api';
import type {
  AdminUser,
  AdminOrganization,
  PaginatedResponse,
  PlatformAuditLog,
  SuspendUserRequest,
  SuspendOrganizationRequest,
  TransferOwnershipRequest,
} from '@/types/admin';

// ============================================================================
// Users
// ============================================================================

export interface ListUsersOptions {
  search?: string;
  suspended?: boolean;
  page?: number;
  limit?: number;
}

/**
 * List all users with pagination and search
 */
export async function listUsers(
  options: ListUsersOptions = {}
): Promise<PaginatedResponse<AdminUser>> {
  const params = new URLSearchParams();
  if (options.search) params.set('search', options.search);
  if (options.suspended !== undefined) params.set('suspended', String(options.suspended));
  if (options.page) params.set('page', String(options.page));
  if (options.limit) params.set('limit', String(options.limit));

  const query = params.toString();
  return api.get<PaginatedResponse<AdminUser>>(`/admin/users${query ? `?${query}` : ''}`);
}

/**
 * Get user details by ID
 */
export async function getUser(id: string): Promise<AdminUser> {
  return api.get<AdminUser>(`/admin/users/${id}`);
}

/**
 * Suspend a user account
 */
export async function suspendUser(id: string, data: SuspendUserRequest): Promise<AdminUser> {
  return api.patch<AdminUser>(`/admin/users/${id}/suspend`, data);
}

/**
 * Unsuspend a user account
 */
export async function unsuspendUser(id: string): Promise<AdminUser> {
  return api.patch<AdminUser>(`/admin/users/${id}/unsuspend`);
}

/**
 * Delete a user account
 */
export async function deleteUser(id: string): Promise<{ message: string }> {
  return api.delete<{ message: string }>(`/admin/users/${id}`);
}

// ============================================================================
// Organizations
// ============================================================================

export interface ListOrganizationsOptions {
  search?: string;
  suspended?: boolean;
  page?: number;
  limit?: number;
}

/**
 * List all organizations with pagination and search
 */
export async function listOrganizations(
  options: ListOrganizationsOptions = {}
): Promise<PaginatedResponse<AdminOrganization>> {
  const params = new URLSearchParams();
  if (options.search) params.set('search', options.search);
  if (options.suspended !== undefined) params.set('suspended', String(options.suspended));
  if (options.page) params.set('page', String(options.page));
  if (options.limit) params.set('limit', String(options.limit));

  const query = params.toString();
  return api.get<PaginatedResponse<AdminOrganization>>(`/admin/organizations${query ? `?${query}` : ''}`);
}

/**
 * Get organization details by ID
 */
export async function getOrganization(id: string): Promise<AdminOrganization> {
  return api.get<AdminOrganization>(`/admin/organizations/${id}`);
}

/**
 * Suspend an organization
 */
export async function suspendOrganization(
  id: string,
  data: SuspendOrganizationRequest
): Promise<AdminOrganization> {
  return api.patch<AdminOrganization>(`/admin/organizations/${id}/suspend`, data);
}

/**
 * Unsuspend an organization
 */
export async function unsuspendOrganization(id: string): Promise<AdminOrganization> {
  return api.patch<AdminOrganization>(`/admin/organizations/${id}/unsuspend`);
}

/**
 * Transfer organization ownership
 */
export async function transferOrganizationOwnership(
  id: string,
  data: TransferOwnershipRequest
): Promise<AdminOrganization> {
  return api.patch<AdminOrganization>(`/admin/organizations/${id}/transfer-ownership`, data);
}

/**
 * Delete an organization
 */
export async function deleteOrganization(id: string): Promise<{ message: string }> {
  return api.delete<{ message: string }>(`/admin/organizations/${id}`);
}

// ============================================================================
// Platform Audit Logs
// ============================================================================

export interface ListPlatformAuditLogsOptions {
  actorId?: string;
  actorEmail?: string;
  action?: string;
  resourceType?: string;
  resourceId?: string;
  targetOrgId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

/**
 * List platform audit logs with filters and pagination
 */
export async function listPlatformAuditLogs(
  options: ListPlatformAuditLogsOptions = {}
): Promise<PaginatedResponse<PlatformAuditLog>> {
  const params = new URLSearchParams();
  if (options.actorId) params.set('actorId', options.actorId);
  if (options.actorEmail) params.set('actorEmail', options.actorEmail);
  if (options.action) params.set('action', options.action);
  if (options.resourceType) params.set('resourceType', options.resourceType);
  if (options.resourceId) params.set('resourceId', options.resourceId);
  if (options.targetOrgId) params.set('targetOrgId', options.targetOrgId);
  if (options.startDate) params.set('startDate', options.startDate);
  if (options.endDate) params.set('endDate', options.endDate);
  if (options.page) params.set('page', String(options.page));
  if (options.limit) params.set('limit', String(options.limit));

  const query = params.toString();
  return api.get<PaginatedResponse<PlatformAuditLog>>(
    `/admin/platform-audit-logs${query ? `?${query}` : ''}`
  );
}

