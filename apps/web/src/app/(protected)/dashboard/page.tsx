import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { DashboardContent } from '@/components/dashboard/dashboard-content';
import { ProtectedHeader } from '@/components/layout/protected-header';
import { PageHeader } from '@/components/layout/page-header';

export const metadata = {
  title: 'Dashboard - ForgeStack',
  description: 'Your ForgeStack dashboard',
};

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return (
    <div className="min-h-screen bg-background">
      <ProtectedHeader userEmail={session?.user?.email} />

      <main className="container mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <PageHeader
          title="Dashboard"
          description="Overview of your projects and organizations"
        />
        <DashboardContent
          userId={session?.user?.id || ''}
          userEmail={session?.user?.email || ''}
          userName={session?.user?.name || null}
        />
      </main>
    </div>
  );
}

