'use client';

/**
 * Admin Dashboard Page
 *
 * Overview page for super-admin dashboard with stats and recent audit logs.
 */

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/layout/page-header';
import { PlatformAuditLogTable } from '@/components/admin/platform-audit-log-table';
import { usePlatformAuditLogs } from '@/hooks/use-admin';
import { Users, Building2, UserX, BuildingIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { api, ApiError } from '@/lib/api';
import type { AdminStats } from '@/types/admin';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);

  const { logs, pagination, error, fetchLogs } = usePlatformAuditLogs({
    autoFetch: true,
    limit: 10,
  });

  // Fetch stats
  useEffect(() => {
    const fetchStats = async () => {
      setIsLoadingStats(true);
      setStatsError(null);

      try {
        // Fetch users and organizations to calculate stats
        const [usersResponse, orgsResponse] = await Promise.all([
          api.get<{ data: unknown[]; pagination: { total: number } }>('/admin/users?limit=1'),
          api.get<{ data: unknown[]; pagination: { total: number } }>('/admin/organizations?limit=1'),
        ]);

        const [suspendedUsersResponse, suspendedOrgsResponse] = await Promise.all([
          api.get<{ data: unknown[]; pagination: { total: number } }>('/admin/users?suspended=true&limit=1'),
          api.get<{ data: unknown[]; pagination: { total: number } }>('/admin/organizations?suspended=true&limit=1'),
        ]);

        setStats({
          totalUsers: usersResponse.pagination.total,
          totalOrganizations: orgsResponse.pagination.total,
          suspendedUsers: suspendedUsersResponse.pagination.total,
          suspendedOrganizations: suspendedOrgsResponse.pagination.total,
        });
      } catch (err) {
        const message = err instanceof ApiError ? err.message : 'Failed to fetch stats';
        setStatsError(message);
        console.error('Error fetching admin stats:', err);
      } finally {
        setIsLoadingStats(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Super Admin Dashboard"
        description="Platform-wide management and monitoring"
      />

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingStats ? (
              <Skeleton className="h-8 w-20" />
            ) : statsError ? (
              <p className="text-sm text-destructive">Error</p>
            ) : (
              <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Organizations</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingStats ? (
              <Skeleton className="h-8 w-20" />
            ) : statsError ? (
              <p className="text-sm text-destructive">Error</p>
            ) : (
              <div className="text-2xl font-bold">{stats?.totalOrganizations || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Suspended Users</CardTitle>
            <UserX className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingStats ? (
              <Skeleton className="h-8 w-20" />
            ) : statsError ? (
              <p className="text-sm text-destructive">Error</p>
            ) : (
              <div className="text-2xl font-bold text-destructive">
                {stats?.suspendedUsers || 0}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Suspended Orgs</CardTitle>
            <BuildingIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingStats ? (
              <Skeleton className="h-8 w-20" />
            ) : statsError ? (
              <p className="text-sm text-destructive">Error</p>
            ) : (
              <div className="text-2xl font-bold text-destructive">
                {stats?.suspendedOrganizations || 0}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Platform Audit Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Platform Audit Logs</CardTitle>
        </CardHeader>
        <CardContent>
          {error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : (
            <PlatformAuditLogTable
              logs={logs}
              pagination={pagination}
              onPageChange={(page) => fetchLogs({ page, limit: 10 })}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

