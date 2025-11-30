'use client';

/**
 * Override Dialog Component
 *
 * Dialog for adding organization overrides to a feature flag.
 */

import { useState, FormEvent } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { CreateOverrideDto, FeatureOverride } from '@/types/feature-flags';

interface OverrideDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (data: CreateOverrideDto) => Promise<FeatureOverride>;
}

export function OverrideDialog({ open, onOpenChange, onCreate }: OverrideDialogProps) {
  const { toast } = useToast();
  const [orgId, setOrgId] = useState('');
  const [enabled, setEnabled] = useState(true);
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate org ID
    const trimmedOrgId = orgId.trim();
    if (!trimmedOrgId) {
      setError('Organization ID is required');
      return;
    }

    // Basic UUID validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(trimmedOrgId)) {
      setError('Please enter a valid organization ID (UUID format)');
      return;
    }

    setIsSubmitting(true);

    try {
      await onCreate({
        orgId: trimmedOrgId,
        enabled,
        reason: reason.trim() || undefined,
      });

      toast({
        title: 'Override Created',
        description: 'Organization override has been created successfully.',
      });

      // Reset form
      setOrgId('');
      setEnabled(true);
      setReason('');
      setError(null);

      onOpenChange(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create override';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen);
    if (!newOpen) {
      // Reset form when closing
      setOrgId('');
      setEnabled(true);
      setReason('');
      setError(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Organization Override</DialogTitle>
          <DialogDescription>
            Override the default behavior for a specific organization.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Organization ID */}
          <div className="space-y-2">
            <Label htmlFor="orgId">
              Organization ID <span className="text-destructive">*</span>
            </Label>
            <Input
              id="orgId"
              value={orgId}
              onChange={(e) => setOrgId(e.target.value)}
              placeholder="00000000-0000-0000-0000-000000000000"
              disabled={isSubmitting}
              required
            />
            <p className="text-xs text-muted-foreground">
              Enter the UUID of the organization to override
            </p>
          </div>

          {/* Enabled */}
          <div className="flex items-center space-x-2">
            <Switch
              id="enabled"
              checked={enabled}
              onCheckedChange={setEnabled}
              disabled={isSubmitting}
            />
            <Label htmlFor="enabled">Enable feature for this organization</Label>
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">Reason (optional)</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why is this override needed?"
              rows={3}
              disabled={isSubmitting}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Override
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

