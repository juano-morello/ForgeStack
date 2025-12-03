/**
 * Onboarding Page
 *
 * Multi-step wizard for new user onboarding.
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/lib/auth-client';
import { ProgressBar } from '@/components/onboarding/progress-bar';
import { WelcomeStep } from '@/components/onboarding/welcome-step';
import { CreateOrgStep } from '@/components/onboarding/create-org-step';
import { InviteTeamStep } from '@/components/onboarding/invite-team-step';
import { ChoosePlanStep } from '@/components/onboarding/choose-plan-step';
import { CompleteStep } from '@/components/onboarding/complete-step';
import { completeOnboarding } from '@/hooks/use-onboarding';
import {
  getOnboardingProgress,
  saveOnboardingProgress,
  clearOnboardingProgress,
  type OnboardingState,
} from '@/lib/onboarding-storage';

const TOTAL_STEPS = 5;

export default function OnboardingPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [currentStep, setCurrentStep] = useState(1);
  const [wizardData, setWizardData] = useState<OnboardingState['data']>({});

  // Restore progress from localStorage on mount
  useEffect(() => {
    const savedProgress = getOnboardingProgress();
    if (savedProgress) {
      setCurrentStep(savedProgress.currentStep);
      setWizardData(savedProgress.data);
    }
  }, []);

  // Save progress to localStorage whenever step or data changes
  useEffect(() => {
    saveOnboardingProgress({
      currentStep,
      data: wizardData,
    });
  }, [currentStep, wizardData]);

  const handleComplete = async () => {
    try {
      await completeOnboarding();
      clearOnboardingProgress();
      router.push('/dashboard');
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
    }
  };

  const handleSkipAll = async () => {
    await handleComplete();
  };

  const renderStep = () => {
    const userName = session?.user?.name || 'there';

    switch (currentStep) {
      case 1:
        return <WelcomeStep userName={userName} onNext={() => setCurrentStep(2)} />;

      case 2:
        return (
          <CreateOrgStep
            onNext={(orgId, orgName) => {
              setWizardData({ ...wizardData, orgId, orgName });
              setCurrentStep(3);
            }}
            onBack={() => setCurrentStep(1)}
            onSkip={() => setCurrentStep(3)}
          />
        );

      case 3:
        return (
          <InviteTeamStep
            onNext={(emails) => {
              setWizardData({ ...wizardData, invitedEmails: emails });
              setCurrentStep(4);
            }}
            onBack={() => setCurrentStep(2)}
            onSkip={() => setCurrentStep(4)}
          />
        );

      case 4:
        return (
          <ChoosePlanStep
            onNext={(planId) => {
              setWizardData({ ...wizardData, selectedPlanId: planId });
              setCurrentStep(5);
            }}
            onBack={() => setCurrentStep(3)}
            onSkip={() => setCurrentStep(5)}
          />
        );

      case 5:
        return <CompleteStep onComplete={handleComplete} />;

      default:
        return null;
    }
  };

  return (
    <div className="space-y-8">
      <ProgressBar currentStep={currentStep} totalSteps={TOTAL_STEPS} />
      {renderStep()}
      <div className="text-center">
        <button
          onClick={handleSkipAll}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Skip onboarding
        </button>
      </div>
    </div>
  );
}

