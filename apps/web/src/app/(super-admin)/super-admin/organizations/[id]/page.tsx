'use client';

/**
 * Admin Organization Detail Page
 *
 * View and manage a specific organization.
 */

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { PageHeader } from '@/components/layout/page-header';
import { useAdminOrganization, useAdminOrganizations } from '@/hooks/use-admin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Building2, UserCheck, Trash2, ArrowRightLeft } from 'lucide-react';
import Link from 'next/link';

export default function AdminOrganizationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { organization, isLoading, error, fetchOrganization } = useAdminOrganization(id);
  const { suspendOrganization, unsuspendOrganization, transferOwnership, deleteOrganization } =
    useAdminOrganizations();

  const [showSuspendDialog, setShowSuspendDialog] = useState(false);
  const [showUnsuspendDialog, setShowUnsuspendDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [newOwnerId, setNewOwnerId] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [isTransferring, setIsTransferring] = useState(false);

  const handleSuspend = async (reason: string) => {
    setActionError(null);
    try {
      await suspendOrganization(id, { reason });
      await fetchOrganization();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to suspend organization');
    }
  };

  const handleUnsuspend = async () => {
    setActionError(null);
    try {
      await unsuspendOrganization(id);
      await fetchOrganization();
      setShowUnsuspendDialog(false);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to unsuspend organization');
    }
  };

  const handleTransfer = async () => {
    if (!newOwnerId.trim()) return;

    setActionError(null);
    setIsTransferring(true);
    try {
      await transferOwnership(id, { newOwnerId: newOwnerId.trim() });
      await fetchOrganization();
      setShowTransferDialog(false);
      setNewOwnerId('');
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to transfer ownership');
    } finally {
      setIsTransferring(false);
    }
  };

  const handleDelete = async () => {
    setActionError(null);
    try {
      await deleteOrganization(id);
      router.push('/super-admin/organizations');
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to delete organization');
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

  if (error || !organization) {
    return (
      <div className="space-y-6">
        <PageHeader title="Organization Not Found" />
        <Alert variant="destructive">
          <AlertDescription>{error || 'Organization not found'}</AlertDescription>
        </Alert>
        <Link href="/super-admin/organizations">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Organizations
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title={organization.name}
          description={`Organization ID: ${organization.id}`}
        />
        <Link href="/super-admin/organizations">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Organizations
          </Button>
        </Link>
      </div>

      {actionError && (
        <Alert variant="destructive">
          <AlertDescription>{actionError}</AlertDescription>
        </Alert>
      )}

      {/* Organization Details */}
      <Card>
        <CardHeader>
          <CardTitle>Organization Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Name</p>
              <p className="text-sm">{organization.name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Status</p>
              {organization.suspendedAt ? (
                <Badge variant="destructive">Suspended</Badge>
              ) : (
                <Badge variant="default">Active</Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Owner Information */}
      <Card>
        <CardHeader>
          <CardTitle>Owner Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Owner User ID</p>
            <p className="text-sm font-mono">{organization.ownerUserId}</p>
          </div>
        </CardContent>
      </Card>

      {/* Suspension Details */}
      {organization.suspendedAt && (
        <Card>
          <CardHeader>
            <CardTitle>Suspension Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Suspended At</p>
                <p className="text-sm">
                  {format(new Date(organization.suspendedAt), 'PPpp')}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Suspended By</p>
                <p className="text-sm">{organization.suspendedBy || '-'}</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm font-medium text-muted-foreground">Reason</p>
                <p className="text-sm">{organization.suspendedReason || '-'}</p>
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
        <CardContent>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Created At</p>
            <p className="text-sm">{format(new Date(organization.createdAt), 'PPpp')}</p>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4">
          {organization.suspendedAt ? (
            <Button
              variant="default"
              onClick={() => setShowUnsuspendDialog(true)}
            >
              <UserCheck className="h-4 w-4 mr-2" />
              Unsuspend Organization
            </Button>
          ) : (
            <Button
              variant="destructive"
              onClick={() => setShowSuspendDialog(true)}
            >
              <Building2 className="h-4 w-4 mr-2" />
              Suspend Organization
            </Button>
          )}

          <Button
            variant="outline"
            onClick={() => setShowTransferDialog(true)}
          >
            <ArrowRightLeft className="h-4 w-4 mr-2" />
            Transfer Ownership
          </Button>

          <Button
            variant="outline"
            onClick={() => setShowDeleteDialog(true)}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Organization
          </Button>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <SuspendDialog
        open={showSuspendDialog}
        onOpenChange={setShowSuspendDialog}
        title="Suspend Organization"
        description={`Are you sure you want to suspend ${organization.name}? All members will lose access.`}
        onConfirm={handleSuspend}
      />

      <AlertDialog open={showUnsuspendDialog} onOpenChange={setShowUnsuspendDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsuspend Organization</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to unsuspend {organization.name}? Members will regain access.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleUnsuspend}>Unsuspend</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={showTransferDialog} onOpenChange={setShowTransferDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transfer Ownership</DialogTitle>
            <DialogDescription>
              Transfer ownership of {organization.name} to a different user.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="newOwnerId">New Owner User ID *</Label>
            <Input
              id="newOwnerId"
              placeholder="Enter user ID..."
              value={newOwnerId}
              onChange={(e) => setNewOwnerId(e.target.value)}
              disabled={isTransferring}
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowTransferDialog(false)}
              disabled={isTransferring}
            >
              Cancel
            </Button>
            <Button
              onClick={handleTransfer}
              disabled={!newOwnerId.trim() || isTransferring}
            >
              Transfer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Organization</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {organization.name}? This action cannot be undone.
              All organization data will be permanently removed.
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

