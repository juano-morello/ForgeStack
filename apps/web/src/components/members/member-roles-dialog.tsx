'use client';

/**
 * Member Roles Dialog Component
 *
 * Dialog for viewing and editing a member's roles.
 */

import { useState, useEffect } from 'react';
import { useMemberRoles } from '@/hooks/use-member-roles';
import { useRoles } from '@/hooks/use-roles';
import { useOrgContext } from '@/components/providers/org-provider';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, Shield } from 'lucide-react';

interface MemberRolesDialogProps {
  userId: string | null;
  userName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MemberRolesDialog({
  userId,
  userName,
  open,
  onOpenChange,
}: MemberRolesDialogProps) {
  const { currentOrg } = useOrgContext();
  const { toast } = useToast();
  const { memberRoles, isLoading: isLoadingMemberRoles, fetchMemberRoles, assignRoles } =
    useMemberRoles({ userId, autoFetch: false });
  const { roles, isLoading: isLoadingRoles } = useRoles({
    orgId: currentOrg?.id || null,
  });

  const [selectedRoleIds, setSelectedRoleIds] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load member roles when dialog opens
  useEffect(() => {
    if (open && userId) {
      fetchMemberRoles();
    }
  }, [open, userId, fetchMemberRoles]);

  // Update selected roles when member roles are loaded
  useEffect(() => {
    if (memberRoles) {
      setSelectedRoleIds(new Set(memberRoles.roles.map((r) => r.id)));
    }
  }, [memberRoles]);

  const handleRoleToggle = (roleId: string, checked: boolean) => {
    setSelectedRoleIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(roleId);
      } else {
        next.delete(roleId);
      }
      return next;
    });
  };

  const handleSubmit = async () => {
    if (selectedRoleIds.size === 0) {
      setError('At least one role must be selected');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await assignRoles({ roleIds: Array.from(selectedRoleIds) });
      toast({
        title: 'Roles updated',
        description: `Roles for ${userName} have been updated.`,
      });
      onOpenChange(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update roles';
      setError(message);
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLoading = isLoadingMemberRoles || isLoadingRoles;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Roles</DialogTitle>
          <DialogDescription>
            Assign roles to <strong>{userName}</strong>
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <div className="space-y-3">
              {roles.map((role) => (
                <div
                  key={role.id}
                  className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50"
                >
                  <Checkbox
                    id={role.id}
                    checked={selectedRoleIds.has(role.id)}
                    onCheckedChange={(checked) => handleRoleToggle(role.id, checked as boolean)}
                    disabled={isSubmitting}
                  />
                  <div className="flex-1">
                    <Label htmlFor={role.id} className="flex items-center gap-2 cursor-pointer">
                      <Shield className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{role.name}</span>
                      {role.isSystem && (
                        <Badge variant="secondary" className="text-xs">
                          System
                        </Badge>
                      )}
                    </Label>
                    {role.description && (
                      <p className="text-xs text-muted-foreground mt-1">{role.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || isLoading}>
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

