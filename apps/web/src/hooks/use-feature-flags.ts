'use client';

/**
 * useFeatureFlags Hooks
 *
 * Hooks for managing feature flags state.
 */

import { useState, useCallback, useEffect } from 'react';
import { ApiError } from '@/lib/api';
import {
  listFeatureFlags as listFeatureFlagsApi,
  createFeatureFlag as createFeatureFlagApi,
  updateFeatureFlag as updateFeatureFlagApi,
  deleteFeatureFlag as deleteFeatureFlagApi,
  listOverrides as listOverridesApi,
  createOverride as createOverrideApi,
  deleteOverride as deleteOverrideApi,
  getEnabledFeatures as getEnabledFeaturesApi,
  checkFeature as checkFeatureApi,
  getFeaturesWithStatus as getFeaturesWithStatusApi,
} from '@/lib/api/feature-flags';
import type {
  FeatureFlag,
  FeatureOverride,
  CreateFeatureFlagDto,
  UpdateFeatureFlagDto,
  CreateOverrideDto,
  FeatureStatus,
} from '@/types/feature-flags';

// ============================================================================
// Admin Hooks
// ============================================================================

interface UseFeatureFlagsOptions {
  autoFetch?: boolean;
}

/**
 * Hook for managing feature flags (admin only)
 */
export function useFeatureFlags({ autoFetch = true }: UseFeatureFlagsOptions = {}) {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all feature flags
  const fetchFlags = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await listFeatureFlagsApi();
      setFlags(data);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to fetch feature flags';
      setError(message);
      console.error('Error fetching feature flags:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Create a new feature flag
  const createFlag = useCallback(
    async (data: CreateFeatureFlagDto): Promise<FeatureFlag> => {
      setError(null);

      try {
        const newFlag = await createFeatureFlagApi(data);
        setFlags((prev) => [newFlag, ...prev]);
        return newFlag;
      } catch (err) {
        const message = err instanceof ApiError ? err.message : 'Failed to create feature flag';
        setError(message);
        throw err;
      }
    },
    []
  );

  // Update an existing feature flag
  const updateFlag = useCallback(
    async (id: string, data: UpdateFeatureFlagDto): Promise<FeatureFlag> => {
      setError(null);

      try {
        const updatedFlag = await updateFeatureFlagApi(id, data);
        setFlags((prev) => prev.map((flag) => (flag.id === id ? updatedFlag : flag)));
        return updatedFlag;
      } catch (err) {
        const message = err instanceof ApiError ? err.message : 'Failed to update feature flag';
        setError(message);
        throw err;
      }
    },
    []
  );

  // Delete a feature flag
  const deleteFlag = useCallback(
    async (id: string): Promise<void> => {
      setError(null);

      try {
        await deleteFeatureFlagApi(id);
        setFlags((prev) => prev.filter((flag) => flag.id !== id));
      } catch (err) {
        const message = err instanceof ApiError ? err.message : 'Failed to delete feature flag';
        setError(message);
        throw err;
      }
    },
    []
  );

  // Auto-fetch on mount if enabled
  useEffect(() => {
    if (autoFetch) {
      fetchFlags();
    }
  }, [autoFetch, fetchFlags]);

  return {
    flags,
    isLoading,
    error,
    fetchFlags,
    createFlag,
    updateFlag,
    deleteFlag,
  };
}

interface UseFeatureOverridesOptions {
  flagId: string;
  autoFetch?: boolean;
}

/**
 * Hook for managing feature flag overrides (admin only)
 */
export function useFeatureOverrides({ flagId, autoFetch = true }: UseFeatureOverridesOptions) {
  const [overrides, setOverrides] = useState<FeatureOverride[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch overrides for a flag
  const fetchOverrides = useCallback(async () => {
    if (!flagId) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await listOverridesApi(flagId);
      setOverrides(data);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to fetch overrides';
      setError(message);
      console.error('Error fetching overrides:', err);
    } finally {
      setIsLoading(false);
    }
  }, [flagId]);

  // Create a new override
  const createOverride = useCallback(
    async (data: CreateOverrideDto): Promise<FeatureOverride> => {
      if (!flagId) {
        throw new Error('Flag ID is required');
      }

      setError(null);

      try {
        const newOverride = await createOverrideApi(flagId, data);
        setOverrides((prev) => [newOverride, ...prev]);
        return newOverride;
      } catch (err) {
        const message = err instanceof ApiError ? err.message : 'Failed to create override';
        setError(message);
        throw err;
      }
    },
    [flagId]
  );

  // Delete an override
  const deleteOverride = useCallback(
    async (orgId: string): Promise<void> => {
      if (!flagId) {
        throw new Error('Flag ID is required');
      }

      setError(null);

      try {
        await deleteOverrideApi(flagId, orgId);
        setOverrides((prev) => prev.filter((override) => override.orgId !== orgId));
      } catch (err) {
        const message = err instanceof ApiError ? err.message : 'Failed to delete override';
        setError(message);
        throw err;
      }
    },
    [flagId]
  );

  // Auto-fetch on mount if enabled
  useEffect(() => {
    if (autoFetch && flagId) {
      fetchOverrides();
    }
  }, [autoFetch, flagId, fetchOverrides]);

  return {
    overrides,
    isLoading,
    error,
    fetchOverrides,
    createOverride,
    deleteOverride,
  };
}

// ============================================================================
// Public Hooks (For Organizations)
// ============================================================================

interface UseEnabledFeaturesOptions {
  orgId: string;
  autoFetch?: boolean;
}

/**
 * Hook for getting enabled features for an organization
 */
export function useEnabledFeatures({ orgId, autoFetch = true }: UseEnabledFeaturesOptions) {
  const [features, setFeatures] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFeatures = useCallback(async () => {
    if (!orgId) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await getEnabledFeaturesApi(orgId);
      setFeatures(data.features);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to fetch enabled features';
      setError(message);
      console.error('Error fetching enabled features:', err);
    } finally {
      setIsLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    if (autoFetch && orgId) {
      fetchFeatures();
    }
  }, [autoFetch, orgId, fetchFeatures]);

  return {
    features,
    isLoading,
    error,
    fetchFeatures,
  };
}

interface UseFeatureCheckOptions {
  orgId: string;
  key: string;
  autoFetch?: boolean;
}

/**
 * Hook for checking if a specific feature is enabled
 */
export function useFeatureCheck({ orgId, key, autoFetch = true }: UseFeatureCheckOptions) {
  const [enabled, setEnabled] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkFeature = useCallback(async () => {
    if (!orgId || !key) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await checkFeatureApi(orgId, key);
      setEnabled(data.enabled);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to check feature';
      setError(message);
      console.error('Error checking feature:', err);
    } finally {
      setIsLoading(false);
    }
  }, [orgId, key]);

  useEffect(() => {
    if (autoFetch && orgId && key) {
      checkFeature();
    }
  }, [autoFetch, orgId, key, checkFeature]);

  return {
    enabled,
    isLoading,
    error,
    checkFeature,
  };
}

interface UseFeaturesWithStatusOptions {
  orgId: string;
  autoFetch?: boolean;
}

/**
 * Hook for getting all features with their status for an organization
 */
export function useFeaturesWithStatus({ orgId, autoFetch = true }: UseFeaturesWithStatusOptions) {
  const [features, setFeatures] = useState<FeatureStatus[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFeatures = useCallback(async () => {
    if (!orgId) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await getFeaturesWithStatusApi(orgId);
      setFeatures(data);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to fetch features';
      setError(message);
      console.error('Error fetching features with status:', err);
    } finally {
      setIsLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    if (autoFetch && orgId) {
      fetchFeatures();
    }
  }, [autoFetch, orgId, fetchFeatures]);

  return {
    features,
    isLoading,
    error,
    fetchFeatures,
  };
}

