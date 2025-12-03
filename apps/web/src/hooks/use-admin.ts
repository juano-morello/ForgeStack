'use client';

/**
 * useAdmin Hooks
 *
 * Hooks for super-admin data fetching and mutations.
 */

import { useState, useCallback, useEffect } from 'react';
import { ApiError } from '@/lib/api';
import {
  listUsers,
  getUser,
  suspendUser as suspendUserApi,
  unsuspendUser as unsuspendUserApi,
  deleteUser as deleteUserApi,
  listOrganizations,
  getOrganization,
  suspendOrganization as suspendOrganizationApi,
  unsuspendOrganization as unsuspendOrganizationApi,
  transferOrganizationOwnership as transferOrganizationOwnershipApi,
  deleteOrganization as deleteOrganizationApi,
  listPlatformAuditLogs,
  type ListUsersOptions,
  type ListOrganizationsOptions,
  type ListPlatformAuditLogsOptions,
} from '@/lib/api/admin';
import type {
  AdminUser,
  AdminOrganization,
  PlatformAuditLog,
  SuspendUserRequest,
  SuspendOrganizationRequest,
  TransferOwnershipRequest,
} from '@/types/admin';

// ============================================================================
// Users
// ============================================================================

export function useAdminUsers(options: ListUsersOptions & { autoFetch?: boolean } = {}) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async (fetchOptions: ListUsersOptions = {}) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await listUsers(fetchOptions);
      setUsers(response.data);
      setPagination(response.pagination);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to fetch users';
      setError(message);
      console.error('Error fetching admin users:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const suspendUser = useCallback(async (id: string, data: SuspendUserRequest) => {
    setError(null);
    try {
      const updatedUser = await suspendUserApi(id, data);
      setUsers((prev) => prev.map((u) => (u.id === id ? updatedUser : u)));
      return updatedUser;
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to suspend user';
      setError(message);
      throw err;
    }
  }, []);

  const unsuspendUser = useCallback(async (id: string) => {
    setError(null);
    try {
      const updatedUser = await unsuspendUserApi(id);
      setUsers((prev) => prev.map((u) => (u.id === id ? updatedUser : u)));
      return updatedUser;
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to unsuspend user';
      setError(message);
      throw err;
    }
  }, []);

  const deleteUser = useCallback(async (id: string) => {
    setError(null);
    try {
      await deleteUserApi(id);
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to delete user';
      setError(message);
      throw err;
    }
  }, []);

  useEffect(() => {
    if (options.autoFetch) {
      fetchUsers(options);
    }
  }, [options.autoFetch, fetchUsers]);

  return {
    users,
    pagination,
    isLoading,
    error,
    fetchUsers,
    suspendUser,
    unsuspendUser,
    deleteUser,
  };
}

export function useAdminUser(id: string | null) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = useCallback(async () => {
    if (!id) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await getUser(id);
      setUser(data);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to fetch user';
      setError(message);
      console.error('Error fetching admin user:', err);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchUser();
    }
  }, [id, fetchUser]);

  return {
    user,
    isLoading,
    error,
    fetchUser,
  };
}

// ============================================================================
// Organizations
// ============================================================================

export function useAdminOrganizations(
  options: ListOrganizationsOptions & { autoFetch?: boolean } = {}
) {
  const [organizations, setOrganizations] = useState<AdminOrganization[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrganizations = useCallback(async (fetchOptions: ListOrganizationsOptions = {}) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await listOrganizations(fetchOptions);
      setOrganizations(response.data);
      setPagination(response.pagination);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to fetch organizations';
      setError(message);
      console.error('Error fetching admin organizations:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const suspendOrganization = useCallback(
    async (id: string, data: SuspendOrganizationRequest) => {
      setError(null);
      try {
        const updatedOrg = await suspendOrganizationApi(id, data);
        setOrganizations((prev) => prev.map((o) => (o.id === id ? updatedOrg : o)));
        return updatedOrg;
      } catch (err) {
        const message = err instanceof ApiError ? err.message : 'Failed to suspend organization';
        setError(message);
        throw err;
      }
    },
    []
  );

  const unsuspendOrganization = useCallback(async (id: string) => {
    setError(null);
    try {
      const updatedOrg = await unsuspendOrganizationApi(id);
      setOrganizations((prev) => prev.map((o) => (o.id === id ? updatedOrg : o)));
      return updatedOrg;
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to unsuspend organization';
      setError(message);
      throw err;
    }
  }, []);

  const transferOwnership = useCallback(async (id: string, data: TransferOwnershipRequest) => {
    setError(null);
    try {
      const updatedOrg = await transferOrganizationOwnershipApi(id, data);
      setOrganizations((prev) => prev.map((o) => (o.id === id ? updatedOrg : o)));
      return updatedOrg;
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to transfer ownership';
      setError(message);
      throw err;
    }
  }, []);

  const deleteOrganization = useCallback(async (id: string) => {
    setError(null);
    try {
      await deleteOrganizationApi(id);
      setOrganizations((prev) => prev.filter((o) => o.id !== id));
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to delete organization';
      setError(message);
      throw err;
    }
  }, []);

  useEffect(() => {
    if (options.autoFetch) {
      fetchOrganizations(options);
    }
  }, [options.autoFetch, fetchOrganizations]);

  return {
    organizations,
    pagination,
    isLoading,
    error,
    fetchOrganizations,
    suspendOrganization,
    unsuspendOrganization,
    transferOwnership,
    deleteOrganization,
  };
}

export function useAdminOrganization(id: string | null) {
  const [organization, setOrganization] = useState<AdminOrganization | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrganization = useCallback(async () => {
    if (!id) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await getOrganization(id);
      setOrganization(data);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to fetch organization';
      setError(message);
      console.error('Error fetching admin organization:', err);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchOrganization();
    }
  }, [id, fetchOrganization]);

  return {
    organization,
    isLoading,
    error,
    fetchOrganization,
  };
}

// ============================================================================
// Platform Audit Logs
// ============================================================================

export function usePlatformAuditLogs(
  options: ListPlatformAuditLogsOptions & { autoFetch?: boolean } = {}
) {
  const [logs, setLogs] = useState<PlatformAuditLog[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = useCallback(async (fetchOptions: ListPlatformAuditLogsOptions = {}) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await listPlatformAuditLogs(fetchOptions);
      setLogs(response.data);
      setPagination(response.pagination);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to fetch platform audit logs';
      setError(message);
      console.error('Error fetching platform audit logs:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (options.autoFetch) {
      fetchLogs(options);
    }
  }, [options.autoFetch, fetchLogs]);

  return {
    logs,
    pagination,
    isLoading,
    error,
    fetchLogs,
  };
}

