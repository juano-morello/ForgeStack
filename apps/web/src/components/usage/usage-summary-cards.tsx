'use client';

/**
 * Usage Summary Cards Component
 *
 * Displays a grid of usage cards for all metrics.
 */

import { Activity, Database, Users } from 'lucide-react';
import { UsageCard } from './usage-card';
import type { UsageSummary } from '@/types/usage';

interface UsageSummaryCardsProps {
  summary: UsageSummary;
}

// Format bytes to human-readable format
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

export function UsageSummaryCards({ summary }: UsageSummaryCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <UsageCard
        metric={summary.apiCalls}
        title="API Calls"
        icon={<Activity className="h-4 w-4 text-muted-foreground" />}
      />
      <UsageCard
        metric={summary.storage}
        title="Storage"
        icon={<Database className="h-4 w-4 text-muted-foreground" />}
        formatValue={formatBytes}
      />
      <UsageCard
        metric={summary.seats}
        title="Active Seats"
        icon={<Users className="h-4 w-4 text-muted-foreground" />}
      />
    </div>
  );
}

