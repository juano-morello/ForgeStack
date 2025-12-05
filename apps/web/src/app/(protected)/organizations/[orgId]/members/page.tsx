'use client';

/**
 * Organization Members Page
 *
 * Displays all members of an organization with role management.
 * Allows owners to invite new members, change roles, and remove members.
 */

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useOrgContext } from '@/components/providers/org-provider';
import { useMembers } from '@/hooks/use-members';
import { MemberList } from '@/components/members/member-list';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/shared/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, UserPlus, Users } from 'lucide-react';

export default function OrganizationMembersPage() {
  const params = useParams();
  const router = useRouter();
  const orgId = params.orgId as string;
  const { currentOrg, isLoading: isOrgLoading } = useOrgContext();

  const {
    members,
    isLoading: isMembersLoading,
    error,
    updateMemberRole,
    removeMember,
  } = useMembers({ orgId });

  // Get current user's role from the organization context
  const currentUserRole = currentOrg?.role || 'MEMBER';
  const isOwner = currentUserRole === 'OWNER';

  const isLoading = isOrgLoading || isMembersLoading;

  // Wrapper functions to match MemberList component signatures
  const handleUpdateRole = async (userId: string, role: 'OWNER' | 'MEMBER') => {
    await updateMemberRole(userId, { role });
  };

  const handleRemoveMember = async (userId: string) => {
    await removeMember(userId);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-4 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!currentOrg || currentOrg.id !== orgId) {
    return (
      <EmptyState
        icon={Users}
        title="Organization Not Found"
        description="The organization you're looking for doesn't exist or you don't have access to it."
        action={{
          label: 'Back to Organizations',
          href: '/organizations',
        }}
      />
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-destructive/10 p-4">
        <p className="text-sm text-destructive">{error}</p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.back()}
          className="mt-4"
        >
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <>
      {/* Back Link */}
      <div className="mb-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/organizations/${orgId}`}>
            <ArrowLeft className="h-4 w-4" />
            Back to Organization
          </Link>
        </Button>
      </div>

      {/* Page Header */}
      <PageHeader
        title="Members"
        description={`Manage members of ${currentOrg.name}`}
        actions={
          isOwner ? (
            <Button asChild>
              <Link href={`/organizations/${orgId}/members/invite`}>
                <UserPlus className="h-4 w-4" />
                Invite Member
              </Link>
            </Button>
          ) : undefined
        }
      />

      {/* Members List */}
      {members.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No members found"
          description="This organization doesn't have any members yet."
        />
      ) : (
        <MemberList
          members={members}
          currentUserRole={currentUserRole}
          onUpdateRole={handleUpdateRole}
          onRemoveMember={handleRemoveMember}
        />
      )}
    </>
  );
}

