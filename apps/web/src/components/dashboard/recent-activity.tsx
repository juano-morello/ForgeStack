/**
 * Recent Activity Component
 *
 * Displays recent activities in the organization.
 */

import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { EmptyState } from '@/components/shared/empty-state';
import { ActivityItem } from '@/components/activities/activity-item';
import { Activity as ActivityIcon } from 'lucide-react';
import type { Activity } from '@/types/activities';

interface RecentActivityProps {
  activities: Activity[];
}

export function RecentActivity({ activities }: RecentActivityProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Latest updates in your organization</CardDescription>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <EmptyState
            icon={ActivityIcon}
            title="No activity yet"
            description="Activity will appear here as your team works"
          />
        ) : (
          <div className="divide-y">
            {activities.map((activity) => (
              <ActivityItem key={activity.id} activity={activity} showIcon={false} />
            ))}
          </div>
        )}
      </CardContent>
      {activities.length > 0 && (
        <CardFooter>
          <Link
            href="/activities"
            className="text-sm text-primary hover:underline"
          >
            View all activity →
          </Link>
        </CardFooter>
      )}
    </Card>
  );
}

