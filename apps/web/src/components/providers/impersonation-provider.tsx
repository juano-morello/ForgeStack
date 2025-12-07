'use client';

/**
 * Impersonation Provider Component
 *
 * Provides impersonation context and displays the impersonation banner when active.
 */

import { createContext, useContext, ReactNode } from 'react';
import { useImpersonation } from '@/hooks/use-impersonation';
import { ImpersonationBanner } from '@/components/impersonation/impersonation-banner';
import type { ImpersonationSession } from '@/lib/api';

interface ImpersonationContextValue {
  isImpersonating: boolean;
  session: ImpersonationSession | null;
  remainingTime: number;
  isLoading: boolean;
  error: string | null;
  endImpersonation: () => Promise<void>;
  refresh: () => Promise<void>;
}

const ImpersonationContext = createContext<ImpersonationContextValue | null>(null);

interface ImpersonationProviderProps {
  children: ReactNode;
}

export function ImpersonationProvider({ children }: ImpersonationProviderProps) {
  const impersonationState = useImpersonation();

  return (
    <ImpersonationContext.Provider value={impersonationState}>
      {impersonationState.isImpersonating && impersonationState.session && (
        <ImpersonationBanner
          session={impersonationState.session}
          remainingTime={impersonationState.remainingTime}
          onEndImpersonation={impersonationState.endImpersonation}
        />
      )}
      {/* Add top padding when impersonating to prevent content from being hidden */}
      <div className={impersonationState.isImpersonating ? 'pt-16' : ''}>
        {children}
      </div>
    </ImpersonationContext.Provider>
  );
}

export function useImpersonationContext() {
  const context = useContext(ImpersonationContext);
  if (!context) {
    throw new Error('useImpersonationContext must be used within an ImpersonationProvider');
  }
  return context;
}

