/**
 * Feature Flags API Client
 *
 * API functions for feature flag management.
 */

import { api } from '@/lib/api';
import type {
  FeatureFlag,
  FeatureOverride,
  FeatureCheck,
  EnabledFeatures,
  CreateFeatureFlagDto,
  UpdateFeatureFlagDto,
  CreateOverrideDto,
  FeatureStatus,
} from '@/types/feature-flags';

// ============================================================================
// Public Endpoints (For Clients)
// ============================================================================

/**
 * Get all enabled features for the current organization
 */
export async function getEnabledFeatures(_orgId: string): Promise<EnabledFeatures> {
  try {
    const response = await api.get<EnabledFeatures>('/features');
    return response;
  } catch (error) {
    console.error('Failed to get enabled features:', error);
    throw error;
  }
}

/**
 * Check if a specific feature is enabled for the current organization
 */
export async function checkFeature(_orgId: string, key: string): Promise<FeatureCheck> {
  try {
    const response = await api.get<FeatureCheck>(`/features/${key}`);
    return response;
  } catch (error) {
    console.error(`Failed to check feature ${key}:`, error);
    throw error;
  }
}

/**
 * Get all features with their status for the current organization
 */
export async function getFeaturesWithStatus(_orgId: string): Promise<FeatureStatus[]> {
  try {
    const response = await api.get<{ data: FeatureStatus[] }>('/features/status');
    return response.data;
  } catch (error) {
    console.error('Failed to get features with status:', error);
    throw error;
  }
}

// ============================================================================
// Admin Endpoints (System Admin Only)
// ============================================================================

/**
 * List all feature flags (admin only)
 */
export async function listFeatureFlags(): Promise<FeatureFlag[]> {
  try {
    const response = await api.get<{ data: FeatureFlag[] }>('/admin/feature-flags');
    return response.data;
  } catch (error) {
    console.error('Failed to list feature flags:', error);
    throw error;
  }
}

/**
 * Create a new feature flag (admin only)
 */
export async function createFeatureFlag(data: CreateFeatureFlagDto): Promise<FeatureFlag> {
  try {
    const response = await api.post<FeatureFlag>('/admin/feature-flags', data);
    return response;
  } catch (error) {
    console.error('Failed to create feature flag:', error);
    throw error;
  }
}

/**
 * Update an existing feature flag (admin only)
 */
export async function updateFeatureFlag(
  id: string,
  data: UpdateFeatureFlagDto
): Promise<FeatureFlag> {
  try {
    const response = await api.patch<FeatureFlag>(`/admin/feature-flags/${id}`, data);
    return response;
  } catch (error) {
    console.error(`Failed to update feature flag ${id}:`, error);
    throw error;
  }
}

/**
 * Delete a feature flag (admin only)
 */
export async function deleteFeatureFlag(id: string): Promise<void> {
  try {
    await api.delete(`/admin/feature-flags/${id}`);
  } catch (error) {
    console.error(`Failed to delete feature flag ${id}:`, error);
    throw error;
  }
}

/**
 * List overrides for a specific flag (admin only)
 */
export async function listOverrides(flagId: string): Promise<FeatureOverride[]> {
  try {
    const response = await api.get<{ data: FeatureOverride[] }>(
      `/admin/feature-flags/${flagId}/overrides`
    );
    return response.data;
  } catch (error) {
    console.error(`Failed to list overrides for flag ${flagId}:`, error);
    throw error;
  }
}

/**
 * Create an organization override for a flag (admin only)
 */
export async function createOverride(
  flagId: string,
  data: CreateOverrideDto
): Promise<FeatureOverride> {
  try {
    const response = await api.post<FeatureOverride>(
      `/admin/feature-flags/${flagId}/overrides`,
      data
    );
    return response;
  } catch (error) {
    console.error(`Failed to create override for flag ${flagId}:`, error);
    throw error;
  }
}

/**
 * Delete an organization override (admin only)
 */
export async function deleteOverride(flagId: string, orgId: string): Promise<void> {
  try {
    await api.delete(`/admin/feature-flags/${flagId}/overrides/${orgId}`);
  } catch (error) {
    console.error(`Failed to delete override for flag ${flagId}, org ${orgId}:`, error);
    throw error;
  }
}

