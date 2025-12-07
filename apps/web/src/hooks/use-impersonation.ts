'use client';

/**
 * useImpersonation Hook
 *
 * Hook for managing impersonation state with polling for session status.
 */

import { useState, useCallback, useEffect } from 'react';
import { ApiError } from '@/lib/api';
import { impersonationApi } from '@/lib/api';
import type { ImpersonationSession } from '@/lib/api';

interface UseImpersonationReturn {
  isImpersonating: boolean;
  session: ImpersonationSession | null;
  remainingTime: number; // seconds
  isLoading: boolean;
  error: string | null;
  endImpersonation: () => Promise<void>;
  refresh: () => Promise<void>;
}

const POLL_INTERVAL = 5000; // Poll every 5 seconds

/**
 * Hook for impersonation state management
 */
export function useImpersonation(): UseImpersonationReturn {
  const [session, setSession] = useState<ImpersonationSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [remainingTime, setRemainingTime] = useState(0);

  const fetchStatus = useCallback(async () => {
    try {
      const response = await impersonationApi.getStatus();
      setSession(response.session);
      setRemainingTime(response.session?.remainingSeconds ?? 0);
      setError(null);
    } catch (err) {
      // Silently fail for 401/403 (not impersonating or not authorized)
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        setSession(null);
        setRemainingTime(0);
      } else {
        const message = err instanceof ApiError ? err.message : 'Failed to fetch impersonation status';
        setError(message);
        console.error('Error fetching impersonation status:', err);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const endImpersonation = useCallback(async () => {
    setError(null);
    try {
      await impersonationApi.end();
      setSession(null);
      setRemainingTime(0);
      // Redirect to admin dashboard
      window.location.href = '/admin';
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to end impersonation';
      setError(message);
      throw err;
    }
  }, []);

  // Initial fetch on mount
  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Poll for status updates
  useEffect(() => {
    const interval = setInterval(() => {
      fetchStatus();
    }, POLL_INTERVAL);

    return () => clearInterval(interval);
  }, [fetchStatus]);

  // Countdown timer
  useEffect(() => {
    if (!session || remainingTime <= 0) return;

    const timer = setInterval(() => {
      setRemainingTime((prev) => {
        const next = prev - 1;
        if (next <= 0) {
          // Session expired, refresh status
          fetchStatus();
          return 0;
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [session, remainingTime, fetchStatus]);

  return {
    isImpersonating: !!session,
    session,
    remainingTime,
    isLoading,
    error,
    endImpersonation,
    refresh: fetchStatus,
  };
}

