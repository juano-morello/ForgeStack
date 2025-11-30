'use client';

/**
 * Activity Feed Page
 *
 * Main page for viewing organization activities with filters.
 */

import { useState } from 'react';
import { ActivityFeed } from '@/components/activities/activity-feed';
import { ActivityFilters } from '@/components/activities/activity-filters';
import { PageHeader } from '@/components/layout/page-header';
import type { ActivityFilters as ActivityFiltersType } from '@/types/activities';

export default function ActivitiesPage() {
  const [filters, setFilters] = useState<ActivityFiltersType>({});

  return (
    <div className="space-y-6">
      <PageHeader
        title="Activity Feed"
        description="Stay up to date with what's happening in your organization"
      />

      <ActivityFilters filters={filters} onFiltersChange={setFilters} />
      
      <ActivityFeed filters={filters} />
    </div>
  );
}

