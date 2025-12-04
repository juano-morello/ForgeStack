/**
 * Stats Overview Component
 *
 * Displays key organization statistics in a grid.
 */

import { StatsCard } from '@/components/shared/stats-card';
import { FolderKanban, Users, Key, HardDrive } from 'lucide-react';
import { formatBytes } from '@/lib/format';
import type { DashboardStats } from '@/types/dashboard';

interface StatsOverviewProps {
  stats: DashboardStats;
}

export function StatsOverview({ stats }: StatsOverviewProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatsCard
        icon={FolderKanban}
        title="Projects"
        value={stats.projects}
      />
      <StatsCard
        icon={Users}
        title="Team Members"
        value={stats.members}
      />
      <StatsCard
        icon={Key}
        title="API Keys"
        value={stats.apiKeys}
      />
      <StatsCard
        icon={HardDrive}
        title="Storage"
        value={formatBytes(stats.storageUsedBytes)}
      />
    </div>
  );
}

