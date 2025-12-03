'use client';

/**
 * Role Form Component
 *
 * Reusable form for creating and editing custom roles.
 * Includes permission picker grouped by resource.
 */

import { useState, FormEvent } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle } from 'lucide-react';
import { usePermissionsList } from '@/hooks/use-permissions-list';
import type { Role, CreateRoleDto, UpdateRoleDto } from '@/types/rbac';

interface RoleFormProps {
  role?: Role | null;
  onSubmit: (data: CreateRoleDto | UpdateRoleDto) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function RoleForm({ role, onSubmit, onCancel, isSubmitting = false }: RoleFormProps) {
  const isEditing = !!role;
  const { groupedByResource, isLoading: isLoadingPermissions } = usePermissionsList();

  const [name, setName] = useState(role?.name || '');
  const [description, setDescription] = useState(role?.description || '');
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(
    new Set(role?.permissions?.map((p) => p.id) || [])
  );
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Role name is required');
      return;
    }

    if (selectedPermissions.size === 0) {
      setError('At least one permission must be selected');
      return;
    }

    try {
      const data: CreateRoleDto | UpdateRoleDto = {
        name: name.trim(),
        description: description.trim() || undefined,
        permissionIds: Array.from(selectedPermissions),
      };

      await onSubmit(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handlePermissionToggle = (permissionId: string, checked: boolean) => {
    setSelectedPermissions((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(permissionId);
      } else {
        next.delete(permissionId);
      }
      return next;
    });
  };

  const handleSelectAllInResource = (resource: string, checked: boolean) => {
    const permissions = groupedByResource[resource] || [];
    setSelectedPermissions((prev) => {
      const next = new Set(prev);
      permissions.forEach((p) => {
        if (checked) {
          next.add(p.id);
        } else {
          next.delete(p.id);
        }
      });
      return next;
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Name */}
      <div className="space-y-2">
        <Label htmlFor="name">
          Name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Developer"
          disabled={isSubmitting}
          required
        />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Can manage projects and webhooks"
          disabled={isSubmitting}
          rows={3}
        />
      </div>

      {/* Permissions */}
      <div className="space-y-4">
        <Label>
          Permissions <span className="text-destructive">*</span>
        </Label>
        {isLoadingPermissions ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading permissions...
          </div>
        ) : (
          <div className="space-y-4 border rounded-lg p-4 max-h-96 overflow-y-auto">
            {Object.entries(groupedByResource).map(([resource, permissions]) => {
              const allSelected = permissions.every((p) => selectedPermissions.has(p.id));
              const someSelected = permissions.some((p) => selectedPermissions.has(p.id));

              return (
                <div key={resource} className="space-y-2">
                  <div className="flex items-center gap-2 pb-2 border-b">
                    <Checkbox
                      id={`resource-${resource}`}
                      checked={allSelected}
                      // @ts-expect-error - indeterminate is valid but not in types
                      indeterminate={someSelected && !allSelected}
                      onCheckedChange={(checked) =>
                        handleSelectAllInResource(resource, checked as boolean)
                      }
                      disabled={isSubmitting}
                    />
                    <Label
                      htmlFor={`resource-${resource}`}
                      className="font-semibold capitalize cursor-pointer"
                    >
                      {resource.replace(/_/g, ' ')}
                    </Label>
                  </div>
                  <div className="pl-6 space-y-2">
                    {permissions.map((permission) => (
                      <div key={permission.id} className="flex items-start gap-2">
                        <Checkbox
                          id={permission.id}
                          checked={selectedPermissions.has(permission.id)}
                          onCheckedChange={(checked) =>
                            handlePermissionToggle(permission.id, checked as boolean)
                          }
                          disabled={isSubmitting}
                        />
                        <div className="flex-1">
                          <Label
                            htmlFor={permission.id}
                            className="text-sm font-normal cursor-pointer"
                          >
                            {permission.action}
                          </Label>
                          {permission.description && (
                            <p className="text-xs text-muted-foreground">
                              {permission.description}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <p className="text-xs text-muted-foreground">
          Selected: {selectedPermissions.size} permission(s)
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-3 justify-end">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting || isLoadingPermissions}>
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {isEditing ? 'Update Role' : 'Create Role'}
        </Button>
      </div>
    </form>
  );
}

