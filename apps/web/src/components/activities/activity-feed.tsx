'use client';

/**
 * Activity Feed Component
 *
 * Main activity feed container with infinite scroll.
 */

import { useOrgContext } from '@/components/providers/org-provider';
import { useActivities } from '@/hooks/use-activities';
import { ActivityItem } from './activity-item';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/shared/empty-state';
import { Loader2, Activity as ActivityIcon } from 'lucide-react';
import type { ActivityFilters } from '@/types/activities';

interface ActivityFeedProps {
  filters?: ActivityFilters;
}

export function ActivityFeed({ filters }: ActivityFeedProps) {
  const { currentOrg } = useOrgContext();
  const {
    activities,
    isLoading,
    error,
    hasMore,
    loadMore,
  } = useActivities({
    orgId: currentOrg?.id || '',
    filters,
    autoFetch: !!currentOrg?.id,
  });

  if (!currentOrg) {
    return (
      <Card>
        <CardContent className="py-8">
          <EmptyState
            icon={ActivityIcon}
            title="No organization selected"
            description="Select an organization to view activities."
          />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading && activities.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (activities.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <EmptyState
            icon={ActivityIcon}
            title="No activities yet"
            description="Activities will appear here as your team works on projects."
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-0">
          <div className="divide-y">
            {activities.map((activity) => (
              <div key={activity.id} className="px-4">
                <ActivityItem activity={activity} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {hasMore && (
        <div className="flex justify-center">
          <Button
            onClick={loadMore}
            disabled={isLoading}
            variant="outline"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              'Load More'
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

