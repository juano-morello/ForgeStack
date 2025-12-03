import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { AdminSidebar } from '@/components/admin/admin-sidebar';
import { AdminHeader } from '@/components/admin/admin-header';

// Force dynamic rendering for all admin routes
export const dynamic = 'force-dynamic';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // Check if user is authenticated
  if (!session) {
    redirect('/login');
  }

  // Check if user is super-admin
  if (!session.user.isSuperAdmin) {
    redirect('/dashboard');
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <div className="flex-1 flex flex-col">
        <AdminHeader userEmail={session.user.email} />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}

