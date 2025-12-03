/**
 * Onboarding Hook
 *
 * Provides functions for checking and completing onboarding status.
 */

import { api } from '@/lib/api';

export interface OnboardingStatus {
  needsOnboarding: boolean;
  completedAt: string | null;
}

/**
 * Check if the current user needs onboarding
 */
export async function checkOnboardingStatus(): Promise<OnboardingStatus> {
  try {
    const response = await api.get<OnboardingStatus>('/users/me/onboarding-status');
    return response;
  } catch (error) {
    console.error('Failed to check onboarding status:', error);
    throw error;
  }
}

/**
 * Mark onboarding as complete for the current user
 */
export async function completeOnboarding(): Promise<{ completedAt: string }> {
  try {
    const response = await api.post<{ completedAt: string }>('/users/me/complete-onboarding', {});
    return response;
  } catch (error) {
    console.error('Failed to complete onboarding:', error);
    throw error;
  }
}

