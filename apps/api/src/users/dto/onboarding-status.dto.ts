/**
 * Onboarding Status DTO
 * Response type for onboarding status endpoint
 */

export class OnboardingStatusDto {
  needsOnboarding!: boolean;
  completedAt!: Date | null;
}

