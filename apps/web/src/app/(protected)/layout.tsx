import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { OrgProvider } from '@/components/providers/org-provider';
import { AppShell } from '@/components/layout/app-shell';

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
      <AppShell>{children}</AppShell>
    </OrgProvider>
  );
}

