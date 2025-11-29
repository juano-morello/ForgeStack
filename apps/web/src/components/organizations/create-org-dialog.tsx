'use client';

/**
 * Create Organization Dialog Component
 *
 * Modal dialog for creating a new organization.
 * Uses shadcn Dialog component with form validation.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useOrgContext } from '@/components/providers/org-provider';
import { ApiError } from '@/lib/api';
import { Plus } from 'lucide-react';

interface CreateOrgDialogProps {
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

export function CreateOrgDialog({ trigger, onSuccess }: CreateOrgDialogProps) {
  const router = useRouter();
  const { createOrganization } = useOrgContext();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Organization name is required');
      return;
    }
    if (trimmedName.length < 2) {
      setError('Organization name must be at least 2 characters');
      return;
    }
    if (trimmedName.length > 100) {
      setError('Organization name must be 100 characters or less');
      return;
    }

    setIsLoading(true);

    try {
      await createOrganization({ name: trimmedName });
      setName('');
      setOpen(false);
      onSuccess?.();
      router.refresh();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to create organization';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      // Reset form when closing
      setName('');
      setError(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="h-4 w-4" />
            New Organization
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create Organization</DialogTitle>
            <DialogDescription>
              Create a new organization to manage your projects and team.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}
            
            <div className="grid gap-2">
              <Label htmlFor="org-name">Organization Name</Label>
              <Input
                id="org-name"
                placeholder="My Organization"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
                maxLength={100}
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                This will be the name of your organization. You can change it later.
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Organization'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

