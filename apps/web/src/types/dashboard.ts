/**
 * Dashboard Types
 *
 * Type definitions for dashboard data.
 */

import type { Activity } from './activities';
import type { Project } from './project';

export interface DashboardStats {
  projects: number;
  members: number;
  apiKeys: number;
  storageUsedBytes: number;
}

export interface OrgHealth {
  subscriptionStatus: string;
  usageSummary: {
    apiCalls: {
      current: number;
      limit: number | null;
      percentage: number;
    };
    storage: {
      current: number;
      limit: number | null;
      percentage: number;
    };
  };
}

export interface DashboardSummary {
  stats: DashboardStats;
  recentActivity: Activity[];
  recentProjects: Project[];
  orgHealth?: OrgHealth;
}

