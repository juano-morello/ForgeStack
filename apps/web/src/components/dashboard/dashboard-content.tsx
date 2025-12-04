'use client';

/**
 * Dashboard Content Component
 *
 * Client component for dashboard that uses org context and displays dashboard summary.
 */

import { useOrgContext } from '@/components/providers/org-provider';
import { useDashboard } from '@/hooks/use-dashboard';
import { WelcomeHeader } from './welcome-header';
import { StatsOverview } from './stats-overview';
import { RecentActivity } from './recent-activity';
import { RecentProjectsWidget } from './recent-projects-widget';
import { QuickActions } from './quick-actions';
import { OrgHealth } from './org-health';
import { EmptyState } from '@/components/shared/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Building2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface DashboardContentProps {
  userId: string;
  userEmail: string;
  userName: string | null;
}

export function DashboardContent({ userId: _userId, userEmail: _userEmail, userName }: DashboardContentProps) {
  const { organizations, currentOrg, isLoading: orgLoading } = useOrgContext();
  const { data, isLoading: dashboardLoading, error } = useDashboard({
    orgId: currentOrg?.id || '',
    autoFetch: !!currentOrg?.id,
  });

  const hasOrgs = organizations.length > 0;
  const isOwner = currentOrg?.role === 'OWNER';

  // No organizations state
  if (!orgLoading && !hasOrgs) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <EmptyState
              icon={Building2}
              title="Create your first organization"
              description="Organizations help you manage your projects and collaborate with your team."
              action={{
                label: 'Create Organization',
                href: '/organizations/new',
              }}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Loading state
  if (dashboardLoading || !data) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-20 w-full" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-destructive">{error}</p>
              <Button variant="outline" size="sm" className="mt-4" asChild>
                <Link href="/projects">View Projects</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      {currentOrg && userName && (
        <WelcomeHeader userName={userName} orgName={currentOrg.name} />
      )}

      {/* Stats Overview */}
      <StatsOverview stats={data.stats} />

      {/* Two Column Layout */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Left Column */}
        <div className="space-y-6">
          <RecentActivity activities={data.recentActivity} />
          {isOwner && data.orgHealth && <OrgHealth health={data.orgHealth} />}
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <RecentProjectsWidget projects={data.recentProjects} />
          <QuickActions isOwner={isOwner} />
        </div>
      </div>
    </div>
  );
}

