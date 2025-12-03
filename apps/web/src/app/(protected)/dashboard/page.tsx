import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { DashboardContent } from '@/components/dashboard/dashboard-content';

export const metadata = {
  title: 'Dashboard - ForgeStack',
  description: 'Your ForgeStack dashboard',
};

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return (
    <DashboardContent
      userId={session?.user?.id || ''}
      userEmail={session?.user?.email || ''}
      userName={session?.user?.name || null}
    />
  );
}

