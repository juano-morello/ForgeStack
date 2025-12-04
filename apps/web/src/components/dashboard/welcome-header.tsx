/**
 * Welcome Header Component
 *
 * Displays a personalized greeting based on time of day.
 */

import { getTimeBasedGreeting } from '@/lib/format';

interface WelcomeHeaderProps {
  userName: string;
  orgName: string;
}

export function WelcomeHeader({ userName, orgName }: WelcomeHeaderProps) {
  const greeting = getTimeBasedGreeting();

  return (
    <div className="space-y-1">
      <h1 className="text-2xl font-bold tracking-tight">
        {greeting}, {userName}!
      </h1>
      <p className="text-muted-foreground">
        Here&apos;s what&apos;s happening in {orgName}
      </p>
    </div>
  );
}

