'use client';

/**
 * Member List Component
 *
 * Displays a table of organization members with role management.
 * Allows owners to change roles and remove members.
 */

import { useState } from 'react';
import { useSession } from '@/lib/auth-client';
import { useToast } from '@/hooks/use-toast';
import { MemberRoleBadge } from './member-role-badge';
import { MemberRolesBadges } from './member-roles-badges';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Trash2, AlertTriangle } from 'lucide-react';
import type { Member } from '@/types/member';

interface MemberListProps {
  members: Member[];
  currentUserRole: 'OWNER' | 'MEMBER';
  onUpdateRole: (userId: string, role: 'OWNER' | 'MEMBER') => Promise<void>;
  onRemoveMember: (userId: string) => Promise<void>;
}

export function MemberList({
  members,
  currentUserRole,
  onUpdateRole,
  onRemoveMember,
}: MemberListProps) {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [memberToRemove, setMemberToRemove] = useState<Member | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const [updatingRoleFor, setUpdatingRoleFor] = useState<string | null>(null);

  const currentUserId = session?.user?.id;
  const isOwner = currentUserRole === 'OWNER';

  // Count owners to prevent removing/demoting the last owner
  const ownerCount = members.filter((m) => m.role === 'OWNER').length;

  const handleRoleChange = async (userId: string, newRole: 'OWNER' | 'MEMBER') => {
    const member = members.find((m) => m.userId === userId);
    if (!member) return;

    // Prevent demoting the last owner
    if (member.role === 'OWNER' && ownerCount === 1) {
      toast({
        title: 'Cannot change role',
        description: 'Cannot demote the last owner. Promote another member first.',
        variant: 'destructive',
      });
      return;
    }

    setUpdatingRoleFor(userId);
    try {
      await onUpdateRole(userId, newRole);
      toast({
        title: 'Role updated',
        description: `${member.name || member.email} is now a ${newRole}.`,
      });
    } catch (error) {
      toast({
        title: 'Failed to update role',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setUpdatingRoleFor(null);
    }
  };

  const handleRemoveClick = (member: Member) => {
    // Prevent removing the last owner
    if (member.role === 'OWNER' && ownerCount === 1) {
      toast({
        title: 'Cannot remove member',
        description: 'Cannot remove the last owner.',
        variant: 'destructive',
      });
      return;
    }

    setMemberToRemove(member);
  };

  const handleConfirmRemove = async () => {
    if (!memberToRemove) return;

    setIsRemoving(true);
    try {
      await onRemoveMember(memberToRemove.userId);
      toast({
        title: 'Member removed',
        description: `${memberToRemove.name || memberToRemove.email} has been removed.`,
      });
      setMemberToRemove(null);
    } catch (error) {
      toast({
        title: 'Failed to remove member',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsRemoving(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Member</TableHead>
              <TableHead>Legacy Role</TableHead>
              <TableHead>RBAC Roles</TableHead>
              <TableHead>Joined</TableHead>
              {isOwner && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((member) => {
              const isCurrentUser = member.userId === currentUserId;
              const isLastOwner = member.role === 'OWNER' && ownerCount === 1;

              return (
                <TableRow key={member.userId}>
                  <TableCell>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {member.name || member.email}
                        </span>
                        {isCurrentUser && (
                          <Badge variant="outline" className="text-xs">
                            You
                          </Badge>
                        )}
                      </div>
                      {member.name && (
                        <span className="text-sm text-muted-foreground">
                          {member.email}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {isOwner && !isCurrentUser ? (
                      <Select
                        value={member.role}
                        onValueChange={(value) =>
                          handleRoleChange(member.userId, value as 'OWNER' | 'MEMBER')
                        }
                        disabled={updatingRoleFor === member.userId}
                      >
                        <SelectTrigger className="w-[130px]">
                          {updatingRoleFor === member.userId ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <SelectValue />
                          )}
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="OWNER">OWNER</SelectItem>
                          <SelectItem value="MEMBER">MEMBER</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <MemberRoleBadge role={member.role} />
                    )}
                  </TableCell>
                  <TableCell>
                    <MemberRolesBadges
                      userId={member.userId}
                      userName={member.name || member.email}
                      roles={member.roles}
                      isCurrentUser={isCurrentUser}
                    />
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {formatDate(member.joinedAt)}
                    </span>
                  </TableCell>
                  {isOwner && (
                    <TableCell className="text-right">
                      {!isCurrentUser && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveClick(member)}
                          disabled={isLastOwner}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Remove Member Confirmation Dialog */}
      <AlertDialog
        open={!!memberToRemove}
        onOpenChange={(open) => !open && !isRemoving && setMemberToRemove(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-destructive/10 p-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <AlertDialogTitle>Remove Member</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="pt-3">
              Are you sure you want to remove{' '}
              <span className="font-semibold text-foreground">
                {memberToRemove?.name || memberToRemove?.email}
              </span>{' '}
              from this organization? They will lose access to all projects and data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRemoving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmRemove}
              disabled={isRemoving}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isRemoving && <Loader2 className="h-4 w-4 animate-spin" />}
              Remove Member
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}


