/**
 * Feature Flags Types
 *
 * Type definitions for feature flag management.
 */

export type FlagType = 'boolean' | 'plan' | 'percentage';

export interface FeatureFlag {
  id: string;
  key: string;
  name: string;
  description: string | null;
  type: FlagType;
  defaultValue: boolean;
  plans: string[] | null;
  percentage: number | null;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FeatureOverride {
  id: string;
  orgId: string;
  flagId: string;
  enabled: boolean;
  reason: string | null;
  createdAt: string;
  orgName?: string; // Joined from org
}

export interface FeatureCheck {
  key: string;
  enabled: boolean;
}

export interface EnabledFeatures {
  features: string[];
}

export interface CreateFeatureFlagDto {
  key: string;
  name: string;
  description?: string;
  type: FlagType;
  defaultValue?: boolean;
  plans?: string[];
  percentage?: number;
  enabled?: boolean;
}

export interface UpdateFeatureFlagDto {
  name?: string;
  description?: string;
  type?: FlagType;
  defaultValue?: boolean;
  plans?: string[];
  percentage?: number;
  enabled?: boolean;
}

export interface CreateOverrideDto {
  orgId: string;
  enabled: boolean;
  reason?: string;
}

export interface FeatureStatus {
  key: string;
  name: string;
  description: string | null;
  enabled: boolean;
  requiredPlan?: string;
}

