/**
 * Onboarding Layout
 *
 * Full-screen layout for the onboarding wizard without app shell.
 */

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <div className="container max-w-2xl mx-auto py-12 px-4">
        {children}
      </div>
    </div>
  );
}

