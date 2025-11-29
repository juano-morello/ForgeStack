'use client';

/**
 * Organization Provider Component
 *
 * Provides organization context throughout the application.
 * Manages current organization state and syncs across tabs.
 */

import { createContext, useContext, ReactNode } from 'react';
import { useOrganizations } from '@/hooks/use-organizations';
import type { Organization, CreateOrganizationDto } from '@/types/organization';

interface OrgContextValue {
  organizations: Organization[];
  currentOrg: Organization | null;
  isLoading: boolean;
  error: string | null;
  fetchOrganizations: () => Promise<void>;
  createOrganization: (dto: CreateOrganizationDto) => Promise<Organization>;
  setCurrentOrg: (org: Organization) => void;
  clearCurrentOrg: () => void;
}

const OrgContext = createContext<OrgContextValue | null>(null);

interface OrgProviderProps {
  children: ReactNode;
}

export function OrgProvider({ children }: OrgProviderProps) {
  const orgState = useOrganizations();
  
  return (
    <OrgContext.Provider value={orgState}>
      {children}
    </OrgContext.Provider>
  );
}

export function useOrgContext() {
  const context = useContext(OrgContext);
  if (!context) {
    throw new Error('useOrgContext must be used within an OrgProvider');
  }
  return context;
}

