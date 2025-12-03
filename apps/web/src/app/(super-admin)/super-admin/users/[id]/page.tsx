'use client';

/**
 * Admin User Detail Page
 *
 * View and manage a specific user.
 */

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { PageHeader } from '@/components/layout/page-header';
import { useAdminUser, useAdminUsers } from '@/hooks/use-admin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SuspendDialog } from '@/components/admin/suspend-dialog';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, UserX, UserCheck, Trash2 } from 'lucide-react';
import Link from 'next/link';

export default function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { user, isLoading, error, fetchUser } = useAdminUser(id);
  const { suspendUser, unsuspendUser, deleteUser } = useAdminUsers();

  const [showSuspendDialog, setShowSuspendDialog] = useState(false);
  const [showUnsuspendDialog, setShowUnsuspendDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const handleSuspend = async (reason: string) => {
    setActionError(null);
    try {
      await suspendUser(id, { reason });
      await fetchUser();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to suspend user');
    }
  };

  const handleUnsuspend = async () => {
    setActionError(null);
    try {
      await unsuspendUser(id);
      await fetchUser();
      setShowUnsuspendDialog(false);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to unsuspend user');
    }
  };

  const handleDelete = async () => {
    setActionError(null);
    try {
      await deleteUser(id);
      router.push('/super-admin/users');
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to delete user');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="space-y-6">
        <PageHeader title="User Not Found" />
        <Alert variant="destructive">
          <AlertDescription>{error || 'User not found'}</AlertDescription>
        </Alert>
        <Link href="/super-admin/users">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Users
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title={user.name || user.email}
          description={`User ID: ${user.id}`}
        />
        <Link href="/admin/users">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Users
          </Button>
        </Link>
      </div>

      {actionError && (
        <Alert variant="destructive">
          <AlertDescription>{actionError}</AlertDescription>
        </Alert>
      )}

      {/* User Details */}
      <Card>
        <CardHeader>
          <CardTitle>User Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Email</p>
              <p className="text-sm">{user.email}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Name</p>
              <p className="text-sm">{user.name || '-'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Status</p>
              {user.suspendedAt ? (
                <Badge variant="destructive">Suspended</Badge>
              ) : (
                <Badge variant="default">Active</Badge>
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Super Admin</p>
              {user.isSuperAdmin ? (
                <Badge variant="secondary">Yes</Badge>
              ) : (
                <span className="text-sm">No</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Suspension Details */}
      {user.suspendedAt && (
        <Card>
          <CardHeader>
            <CardTitle>Suspension Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Suspended At</p>
                <p className="text-sm">
                  {format(new Date(user.suspendedAt), 'PPpp')}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Suspended By</p>
                <p className="text-sm">{user.suspendedBy || '-'}</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm font-medium text-muted-foreground">Reason</p>
                <p className="text-sm">{user.suspendedReason || '-'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Activity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Last Login</p>
              <p className="text-sm">
                {user.lastLoginAt
                  ? format(new Date(user.lastLoginAt), 'PPpp')
                  : 'Never'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Created At</p>
              <p className="text-sm">{format(new Date(user.createdAt), 'PPpp')}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Updated At</p>
              <p className="text-sm">{format(new Date(user.updatedAt), 'PPpp')}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Email Verified</p>
              <p className="text-sm">{user.emailVerified ? 'Yes' : 'No'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4">
          {user.suspendedAt ? (
            <Button
              variant="default"
              onClick={() => setShowUnsuspendDialog(true)}
            >
              <UserCheck className="h-4 w-4 mr-2" />
              Unsuspend User
            </Button>
          ) : (
            <Button
              variant="destructive"
              onClick={() => setShowSuspendDialog(true)}
            >
              <UserX className="h-4 w-4 mr-2" />
              Suspend User
            </Button>
          )}

          <Button
            variant="outline"
            onClick={() => setShowDeleteDialog(true)}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete User
          </Button>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <SuspendDialog
        open={showSuspendDialog}
        onOpenChange={setShowSuspendDialog}
        title="Suspend User"
        description={`Are you sure you want to suspend ${user.email}? They will not be able to access the platform.`}
        onConfirm={handleSuspend}
      />

      <AlertDialog open={showUnsuspendDialog} onOpenChange={setShowUnsuspendDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsuspend User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to unsuspend {user.email}? They will regain access to the platform.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleUnsuspend}>Unsuspend</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {user.email}? This action cannot be undone.
              All user data will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

