/**
 * Onboarding Storage Utilities
 *
 * Manages localStorage persistence for onboarding wizard progress.
 */

const STEP_KEY = 'forgestack_onboarding_step';
const DATA_KEY = 'forgestack_onboarding_data';

export interface OnboardingState {
  currentStep: number;
  data: {
    orgId?: string;
    orgName?: string;
    invitedEmails?: string[];
    selectedPlanId?: string;
  };
}

export function getOnboardingProgress(): OnboardingState | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const step = localStorage.getItem(STEP_KEY);
    const data = localStorage.getItem(DATA_KEY);
    
    if (!step) return null;
    
    return {
      currentStep: parseInt(step, 10),
      data: data ? JSON.parse(data) : {},
    };
  } catch (error) {
    console.error('Failed to get onboarding progress:', error);
    return null;
  }
}

export function saveOnboardingProgress(state: OnboardingState): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(STEP_KEY, state.currentStep.toString());
    localStorage.setItem(DATA_KEY, JSON.stringify(state.data));
  } catch (error) {
    console.error('Failed to save onboarding progress:', error);
  }
}

export function clearOnboardingProgress(): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(STEP_KEY);
    localStorage.removeItem(DATA_KEY);
  } catch (error) {
    console.error('Failed to clear onboarding progress:', error);
  }
}

