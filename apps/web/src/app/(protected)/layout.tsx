import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { OrgProvider } from '@/components/providers/org-provider';
import { ImpersonationProvider } from '@/components/providers/impersonation-provider';
import { AppShell } from '@/components/layout/app-shell';

// Force dynamic rendering for all protected routes to prevent prerendering issues
export const dynamic = 'force-dynamic';

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect('/login');
  }

  return (
    <OrgProvider>
      <ImpersonationProvider>
        <AppShell>{children}</AppShell>
      </ImpersonationProvider>
    </OrgProvider>
  );
}

