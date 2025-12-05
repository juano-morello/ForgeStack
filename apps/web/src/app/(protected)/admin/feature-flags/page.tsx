'use client';

/**
 * Admin Feature Flags Page
 *
 * Admin-only page for managing feature flags.
 * Requires OWNER role.
 */

import { useState } from 'react';
import { useOrgContext } from '@/components/providers/org-provider';
import { useFeatureFlags, useFeatureOverrides } from '@/hooks/use-feature-flags';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { FeatureFlagsList } from '@/components/feature-flags/feature-flags-list';
import { FeatureFlagDialog } from '@/components/feature-flags/feature-flag-dialog';
import { OverridesList } from '@/components/feature-flags/overrides-list';
import { OverrideDialog } from '@/components/feature-flags/override-dialog';
import { Plus, ShieldAlert } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { FeatureFlag, FeatureOverride } from '@/types/feature-flags';

export default function FeatureFlagsAdminPage() {
  const { currentOrg } = useOrgContext();
  const { toast } = useToast();
  const { flags, isLoading, createFlag, updateFlag, deleteFlag } = useFeatureFlags();

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedFlag, setSelectedFlag] = useState<FeatureFlag | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [flagToDelete, setFlagToDelete] = useState<FeatureFlag | null>(null);

  // Overrides state
  const [overridesDialogOpen, setOverridesDialogOpen] = useState(false);
  const [selectedFlagForOverrides, setSelectedFlagForOverrides] = useState<string | null>(null);
  const {
    overrides,
    isLoading: isLoadingOverrides,
    createOverride,
    deleteOverride,
  } = useFeatureOverrides({
    flagId: selectedFlagForOverrides || '',
    autoFetch: !!selectedFlagForOverrides,
  });

  const isOwner = currentOrg?.role === 'OWNER';

  const handleEdit = (flag: FeatureFlag) => {
    setSelectedFlag(flag);
    setEditDialogOpen(true);
  };

  const handleDelete = (flag: FeatureFlag) => {
    setFlagToDelete(flag);
    setDeleteDialogOpen(true);
  };

  const handleViewOverrides = (flag: FeatureFlag) => {
    setSelectedFlagForOverrides(flag.id);
    setSelectedFlag(flag);
  };

  const confirmDelete = async () => {
    if (!flagToDelete) return;

    try {
      await deleteFlag(flagToDelete.id);
      toast({
        title: 'Flag Deleted',
        description: 'Feature flag has been deleted successfully.',
      });
      setDeleteDialogOpen(false);
      setFlagToDelete(null);
    } catch (error) {
      toast({
        title: 'Failed to delete flag',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    }
  };

  const handleToggleEnabled = async (flag: FeatureFlag, enabled: boolean) => {
    try {
      await updateFlag(flag.id, { enabled });
      toast({
        title: 'Flag Updated',
        description: `Feature flag has been ${enabled ? 'enabled' : 'disabled'}.`,
      });
    } catch (error) {
      toast({
        title: 'Failed to update flag',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteOverride = async (override: FeatureOverride) => {
    try {
      await deleteOverride(override.orgId);
      toast({
        title: 'Override Deleted',
        description: 'Organization override has been deleted successfully.',
      });
    } catch (error) {
      toast({
        title: 'Failed to delete override',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    }
  };

  if (!currentOrg) {
    return (
      <Alert variant="destructive">
        <ShieldAlert className="h-4 w-4" />
        <AlertDescription>Please select an organization to continue.</AlertDescription>
      </Alert>
    );
  }

  if (!isOwner) {
    return (
      <>
        <PageHeader title="Feature Flags" description="Manage feature flags" />
        <Alert variant="destructive">
          <ShieldAlert className="h-4 w-4" />
          <AlertDescription>
            Only organization owners can manage feature flags. Please contact an owner if you need
            access.
          </AlertDescription>
        </Alert>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Feature Flags"
        description="Manage feature flags and organization overrides"
        actions={
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Flag
          </Button>
        }
      />

      <Tabs defaultValue="flags" className="space-y-6">
          <TabsList>
            <TabsTrigger value="flags">Feature Flags</TabsTrigger>
            {selectedFlagForOverrides && (
              <TabsTrigger value="overrides">
                Overrides - {selectedFlag?.name}
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="flags" className="space-y-6">
            <FeatureFlagsList
              flags={flags}
              isLoading={isLoading}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onToggleEnabled={handleToggleEnabled}
              onViewOverrides={handleViewOverrides}
            />
          </TabsContent>

          {selectedFlagForOverrides && (
            <TabsContent value="overrides" className="space-y-6">
              <OverridesList
                overrides={overrides}
                isLoading={isLoadingOverrides}
                onAdd={() => setOverridesDialogOpen(true)}
                onDelete={handleDeleteOverride}
              />
            </TabsContent>
          )}
      </Tabs>

      {/* Create Dialog */}
        <FeatureFlagDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          onCreate={createFlag}
        />

        {/* Edit Dialog */}
        <FeatureFlagDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          flag={selectedFlag}
          onUpdate={updateFlag}
        />

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Feature Flag</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete &quot;{flagToDelete?.name}&quot;? This action
                cannot be undone and will remove all associated overrides.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Override Dialog */}
        {selectedFlagForOverrides && (
          <OverrideDialog
            open={overridesDialogOpen}
            onOpenChange={setOverridesDialogOpen}
            onCreate={createOverride}
          />
        )}
    </>
  );
}

