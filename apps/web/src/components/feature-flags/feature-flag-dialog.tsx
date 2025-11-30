'use client';

/**
 * Feature Flag Dialog Component
 *
 * Dialog wrapper for creating and editing feature flags.
 */

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FeatureFlagForm } from './feature-flag-form';
import { useToast } from '@/hooks/use-toast';
import type { FeatureFlag, CreateFeatureFlagDto, UpdateFeatureFlagDto } from '@/types/feature-flags';

interface FeatureFlagDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  flag?: FeatureFlag | null;
  onCreate?: (data: CreateFeatureFlagDto) => Promise<FeatureFlag>;
  onUpdate?: (id: string, data: UpdateFeatureFlagDto) => Promise<FeatureFlag>;
}

export function FeatureFlagDialog({
  open,
  onOpenChange,
  flag,
  onCreate,
  onUpdate,
}: FeatureFlagDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditMode = !!flag;

  const handleSubmit = async (data: CreateFeatureFlagDto | UpdateFeatureFlagDto) => {
    setIsSubmitting(true);

    try {
      if (isEditMode && onUpdate && flag) {
        await onUpdate(flag.id, data as UpdateFeatureFlagDto);
        toast({
          title: 'Flag Updated',
          description: 'Feature flag has been updated successfully.',
        });
      } else if (onCreate) {
        await onCreate(data as CreateFeatureFlagDto);
        toast({
          title: 'Flag Created',
          description: 'Feature flag has been created successfully.',
        });
      }
      onOpenChange(false);
    } catch (error) {
      toast({
        title: isEditMode ? 'Failed to update flag' : 'Failed to create flag',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Feature Flag' : 'Create Feature Flag'}</DialogTitle>
          <DialogDescription>
            {isEditMode
              ? 'Update the feature flag configuration.'
              : 'Create a new feature flag to control feature availability.'}
          </DialogDescription>
        </DialogHeader>
        <FeatureFlagForm
          flag={flag}
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
          isSubmitting={isSubmitting}
        />
      </DialogContent>
    </Dialog>
  );
}

