'use client';

/**
 * Role Detail/Edit Page
 *
 * View and edit a specific role, including its permissions and members.
 */

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useOrgContext } from '@/components/providers/org-provider';
import { useRoles } from '@/hooks/use-roles';
import { useToast } from '@/hooks/use-toast';
import { PermissionGate } from '@/components/roles/permission-gate';
import { RoleForm } from '@/components/roles/role-form';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Edit, Trash2, Shield, Key } from 'lucide-react';
import type { Role, UpdateRoleDto } from '@/types/rbac';

export default function RoleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { currentOrg } = useOrgContext();
  const { toast } = useToast();
  const { fetchRole, updateRole, deleteRole } = useRoles({
    orgId: currentOrg?.id || null,
    autoFetch: false,
  });

  const roleId = params.roleId as string;
  const [role, setRole] = useState<Role | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const loadRole = async () => {
      try {
        const data = await fetchRole(roleId);
        setRole(data);
      } catch {
        toast({
          title: 'Error',
          description: 'Failed to load role',
          variant: 'destructive',
        });
        router.push('/settings/roles');
      } finally {
        setIsLoading(false);
      }
    };

    loadRole();
  }, [roleId, fetchRole, router, toast]);

  const handleUpdateRole = async (data: UpdateRoleDto) => {
    setIsSubmitting(true);
    try {
      const updated = await updateRole(roleId, data);
      setRole(updated);
      toast({
        title: 'Role updated',
        description: `${data.name || role?.name} has been updated successfully.`,
      });
      setIsEditing(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update role',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRole = async () => {
    setIsDeleting(true);
    try {
      await deleteRole(roleId);
      toast({
        title: 'Role deleted',
        description: `${role?.name} has been deleted.`,
      });
      router.push('/settings/roles');
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete role',
        variant: 'destructive',
      });
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container max-w-4xl py-8 space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!role) {
    return null;
  }

  return (
    <div className="container max-w-4xl py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push('/settings/roles')}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold">{role.name}</h1>
              {role.isSystem && (
                <Badge variant="secondary" className="text-xs">
                  System Role
                </Badge>
              )}
            </div>
            {role.description && (
              <p className="text-muted-foreground mt-1">{role.description}</p>
            )}
          </div>
        </div>
        {!role.isSystem && (
          <div className="flex gap-2">
            <PermissionGate permission="roles:update">
              <Button variant="outline" onClick={() => setIsEditing(!isEditing)}>
                <Edit className="h-4 w-4" />
                {isEditing ? 'Cancel Edit' : 'Edit'}
              </Button>
            </PermissionGate>
            <PermissionGate permission="roles:delete">
              <Button
                variant="destructive"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            </PermissionGate>
          </div>
        )}
      </div>

      {/* Edit Form or Details */}
      {isEditing && !role.isSystem ? (
        <Card>
          <CardHeader>
            <CardTitle>Edit Role</CardTitle>
            <CardDescription>Update the role name, description, and permissions.</CardDescription>
          </CardHeader>
          <CardContent>
            <RoleForm
              role={role}
              onSubmit={handleUpdateRole}
              onCancel={() => setIsEditing(false)}
              isSubmitting={isSubmitting}
            />
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Permissions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Permissions ({role.permissions?.length || 0})
              </CardTitle>
              <CardDescription>
                {role.isSystem
                  ? 'System role permissions cannot be modified.'
                  : 'Permissions granted to this role.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {role.permissions && role.permissions.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {role.permissions.map((permission) => (
                    <div
                      key={permission.id}
                      className="flex items-start gap-2 p-3 border rounded-lg"
                    >
                      <Shield className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="font-medium text-sm">{permission.name}</p>
                        {permission.description && (
                          <p className="text-xs text-muted-foreground">
                            {permission.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No permissions assigned.</p>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Role</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{role.name}</strong>? This action cannot be
              undone. All members with this role will need to be reassigned.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteRole}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

