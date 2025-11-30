'use client';

/**
 * Recent Activities Widget Component
 *
 * Compact widget for displaying recent activities on the dashboard.
 */

import Link from 'next/link';
import { useOrgContext } from '@/components/providers/org-provider';
import { useRecentActivities } from '@/hooks/use-activities';
import { ActivityItem } from './activity-item';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/shared/empty-state';
import { Activity as ActivityIcon, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface RecentActivitiesWidgetProps {
  limit?: number;
}

export function RecentActivitiesWidget({ limit = 5 }: RecentActivitiesWidgetProps) {
  const { currentOrg } = useOrgContext();
  const {
    activities,
    isLoading,
    error,
  } = useRecentActivities({
    orgId: currentOrg?.id || '',
    limit,
    autoFetch: !!currentOrg?.id,
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/activities" className="text-sm text-primary hover:underline flex items-center gap-1">
            View all
            <ArrowRight className="h-3 w-3" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(limit)].map((_, i) => (
              <div key={i} className="flex items-start gap-3">
                <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-4">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        ) : activities.length === 0 ? (
          <EmptyState
            icon={ActivityIcon}
            title="No recent activity"
            description="Activities will appear here as your team works."
          />
        ) : (
          <div className="divide-y">
            {activities.map((activity) => (
              <ActivityItem key={activity.id} activity={activity} showIcon={false} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

