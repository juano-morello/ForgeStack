'use client';

/**
 * useOrganizations Hook
 *
 * Hook for managing organization state including fetching, creating,
 * and switching between organizations.
 */

import { useState, useEffect, useCallback } from 'react';
import { api, ApiError } from '@/lib/api';
import type { Organization, OrganizationsResponse, CreateOrganizationDto } from '@/types/organization';

const CURRENT_ORG_KEY = 'currentOrgId';

export function useOrganizations() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [currentOrg, setCurrentOrgState] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load current org ID from localStorage
  const getCurrentOrgId = useCallback(() => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(CURRENT_ORG_KEY);
  }, []);

  // Save current org ID to localStorage
  const saveCurrentOrgId = useCallback((orgId: string | null) => {
    if (typeof window === 'undefined') return;
    if (orgId) {
      localStorage.setItem(CURRENT_ORG_KEY, orgId);
    } else {
      localStorage.removeItem(CURRENT_ORG_KEY);
    }
  }, []);

  // Fetch all organizations for the user
  const fetchOrganizations = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.get<OrganizationsResponse>('/organizations');
      setOrganizations(data.items);

      // Set current org from localStorage or first org
      const savedOrgId = getCurrentOrgId();
      const savedOrg = data.items.find(org => org.id === savedOrgId) ?? null;
      const firstOrg = data.items[0] ?? null;

      if (savedOrg) {
        setCurrentOrgState(savedOrg);
      } else if (firstOrg) {
        setCurrentOrgState(firstOrg);
        saveCurrentOrgId(firstOrg.id);
      } else {
        setCurrentOrgState(null);
        saveCurrentOrgId(null);
      }
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to fetch organizations';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [getCurrentOrgId, saveCurrentOrgId]);

  // Create a new organization
  const createOrganization = useCallback(async (dto: CreateOrganizationDto): Promise<Organization> => {
    const org = await api.post<Organization>('/organizations', dto);
    setOrganizations(prev => [...prev, { ...org, role: 'OWNER' }]);
    // Set as current org after creation
    setCurrentOrgState({ ...org, role: 'OWNER' });
    saveCurrentOrgId(org.id);
    return org;
  }, [saveCurrentOrgId]);

  // Switch to a different organization
  const setCurrentOrg = useCallback((org: Organization) => {
    setCurrentOrgState(org);
    saveCurrentOrgId(org.id);
  }, [saveCurrentOrgId]);

  // Clear current org (e.g., on logout)
  const clearCurrentOrg = useCallback(() => {
    setCurrentOrgState(null);
    saveCurrentOrgId(null);
  }, [saveCurrentOrgId]);

  // Fetch organizations on mount
  useEffect(() => {
    fetchOrganizations();
  }, [fetchOrganizations]);

  // Listen for storage changes (sync across tabs)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === CURRENT_ORG_KEY) {
        const newOrgId = e.newValue;
        const newOrg = organizations.find(org => org.id === newOrgId);
        if (newOrg) {
          setCurrentOrgState(newOrg);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [organizations]);

  return {
    organizations,
    currentOrg,
    isLoading,
    error,
    fetchOrganizations,
    createOrganization,
    setCurrentOrg,
    clearCurrentOrg,
  };
}

