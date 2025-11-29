'use client';

/**
 * Dashboard Content Component
 *
 * Client component for dashboard that uses org context.
 */

import Link from 'next/link';
import { useOrgContext } from '@/components/providers/org-provider';
import { RecentProjects } from '@/components/projects/recent-projects';
import { EmptyState } from '@/components/shared/empty-state';
import { StatsCard } from '@/components/shared/stats-card';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, FolderKanban, Users, Plus, ArrowRight } from 'lucide-react';

interface DashboardContentProps {
  userId: string;
  userEmail: string;
  userName: string | null;
}

export function DashboardContent({ userId: _userId, userEmail: _userEmail, userName }: DashboardContentProps) {
  const { organizations, currentOrg, isLoading } = useOrgContext();

  const hasOrgs = organizations.length > 0;

  return (
    <div className="space-y-6">
      {/* Welcome Message */}
      {currentOrg && (
        <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-background border-primary/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">Welcome back{userName ? `, ${userName}` : ''}!</CardTitle>
                <CardDescription className="mt-1">
                  You're working in <span className="font-semibold text-foreground">{currentOrg.name}</span>
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/organizations">
                  Switch Organization
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            </div>
          </CardHeader>
        </Card>
      )}

      {/* No Organizations - Call to Action */}
      {!isLoading && !hasOrgs && (
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
      )}

      {/* Stats Row (when user has an org selected) */}
      {currentOrg && (
        <div className="grid gap-4 md:grid-cols-3">
          <StatsCard
            icon={Building2}
            title="Organizations"
            value={organizations.length}
          />
          <StatsCard
            icon={FolderKanban}
            title="Total Projects"
            value="—"
          />
          <StatsCard
            icon={Users}
            title="Team Members"
            value={currentOrg.memberCount || 1}
          />
        </div>
      )}

      {/* Recent Projects Section (when user has an org selected) */}
      {currentOrg && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold tracking-tight">Recent Projects</h2>
            <Button variant="outline" size="sm" asChild>
              <Link href="/projects/new">
                <Plus className="h-4 w-4" />
                New Project
              </Link>
            </Button>
          </div>
          <RecentProjects limit={5} />
        </div>
      )}

      {/* Quick Actions (when user has an org selected) */}
      {currentOrg && (
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks to get you started</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <Button variant="outline" className="justify-start h-auto py-3" asChild>
              <Link href="/projects/new">
                <FolderKanban className="h-5 w-5 mr-3" />
                <div className="text-left">
                  <div className="font-semibold">Create Project</div>
                  <div className="text-xs text-muted-foreground">Start a new project</div>
                </div>
              </Link>
            </Button>
            <Button variant="outline" className="justify-start h-auto py-3" asChild>
              <Link href="/organizations">
                <Building2 className="h-5 w-5 mr-3" />
                <div className="text-left">
                  <div className="font-semibold">Manage Organizations</div>
                  <div className="text-xs text-muted-foreground">View all organizations</div>
                </div>
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

