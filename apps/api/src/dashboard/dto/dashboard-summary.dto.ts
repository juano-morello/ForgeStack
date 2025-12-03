/**
 * Dashboard Summary DTOs
 * Response types for dashboard endpoint
 */

import { type Activity } from '@forgestack/db';
import { type Project } from '@forgestack/db';

export interface DashboardStatsDto {
  projects: number;
  members: number;
  apiKeys: number;
  storageUsedBytes: number;
}

export interface DashboardOrgHealthDto {
  subscriptionStatus: string;
  usageSummary: {
    apiCalls: {
      used: number;
      limit: number | null;
      percentUsed: number;
    };
    storage: {
      usedBytes: number;
      limitBytes: number | null;
      percentUsed: number;
    };
    seats: {
      active: number;
      limit: number | null;
      percentUsed: number;
    };
  };
}

export interface DashboardSummaryDto {
  stats: DashboardStatsDto;
  recentActivity: Activity[];
  recentProjects: Project[];
  orgHealth?: DashboardOrgHealthDto | null;
}

