/**
 * Feature Flag Constants
 *
 * Constants and helper functions for feature flag types and plans.
 */

import type { FlagType } from '@/types/feature-flags';

export const FLAG_TYPES = {
  boolean: {
    label: 'Boolean',
    description: 'Simple on/off toggle',
    icon: 'toggle',
  },
  plan: {
    label: 'Plan-Based',
    description: 'Enabled based on subscription plan',
    icon: 'crown',
  },
  percentage: {
    label: 'Percentage Rollout',
    description: 'Enabled for X% of organizations',
    icon: 'percent',
  },
} as const;

export const PLANS = ['free', 'starter', 'pro', 'enterprise'] as const;

export type Plan = (typeof PLANS)[number];

/**
 * Get the display label for a flag type
 */
export function getFlagTypeLabel(type: FlagType): string {
  return FLAG_TYPES[type]?.label || type;
}

/**
 * Get the description for a flag type
 */
export function getFlagTypeDescription(type: FlagType): string {
  return FLAG_TYPES[type]?.description || '';
}

/**
 * Get the icon name for a flag type
 */
export function getFlagTypeIcon(type: FlagType): string {
  return FLAG_TYPES[type]?.icon || 'flag';
}

/**
 * Validate flag key format (lowercase, hyphens, underscores)
 */
export function validateFlagKey(key: string): boolean {
  const FLAG_KEY_REGEX = /^[a-z][a-z0-9_-]{2,63}$/;
  return FLAG_KEY_REGEX.test(key);
}

/**
 * Get validation error message for flag key
 */
export function getFlagKeyValidationError(key: string): string | null {
  if (!key) {
    return 'Flag key is required';
  }
  if (key.length < 3) {
    return 'Flag key must be at least 3 characters';
  }
  if (key.length > 64) {
    return 'Flag key must be 64 characters or less';
  }
  if (!/^[a-z]/.test(key)) {
    return 'Flag key must start with a lowercase letter';
  }
  if (!/^[a-z][a-z0-9_-]*$/.test(key)) {
    return 'Flag key can only contain lowercase letters, numbers, hyphens, and underscores';
  }
  return null;
}

/**
 * Format plan name for display
 */
export function formatPlanName(plan: string): string {
  return plan.charAt(0).toUpperCase() + plan.slice(1);
}

