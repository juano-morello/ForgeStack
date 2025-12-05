'use client';

/**
 * API Keys Settings Page
 *
 * Allows organization owners to manage API keys for programmatic access.
 * Only accessible to users with OWNER role.
 */

import { useState } from 'react';
import { useOrgContext } from '@/components/providers/org-provider';
import { useApiKeys } from '@/hooks/use-api-keys';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ApiKeysList } from '@/components/api-keys/api-keys-list';
import { CreateApiKeyDialog } from '@/components/api-keys/create-api-key-dialog';
import { ApiKeyDisplay } from '@/components/api-keys/api-key-display';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { XCircle, Key, Plus, ShieldAlert } from 'lucide-react';
import type { ApiKeyCreated } from '@/types/api-keys';

export default function ApiKeysPage() {
  const { currentOrg, isLoading: isOrgLoading } = useOrgContext();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [rotatedKey, setRotatedKey] = useState<ApiKeyCreated | null>(null);

  const {
    apiKeys,
    isLoading: isKeysLoading,
    error,
    createKey,
    revokeKey,
    rotateKey,
  } = useApiKeys({
    orgId: currentOrg?.id || '',
    autoFetch: !!currentOrg,
  });

  const isOwner = currentOrg?.role === 'OWNER';

  // Handle key rotation - show the new key to user
  const handleRotateKey = async (keyId: string): Promise<void> => {
    const newKey = await rotateKey(keyId);
    setRotatedKey(newKey);
  };

  if (isOrgLoading) {
    return (
      <>
        <PageHeader title="API Keys" description="Loading..." />
        <div className="space-y-6">
          <Skeleton className="h-48 w-full" />
        </div>
      </>
    );
  }

  if (!currentOrg) {
    return (
      <Alert variant="destructive">
        <XCircle className="h-4 w-4" />
        <AlertDescription>
          Please select an organization to view API keys.
        </AlertDescription>
      </Alert>
    );
  }

  if (!isOwner) {
    return (
      <>
        <PageHeader
          title="API Keys"
          description={`API keys for ${currentOrg.name}`}
        />
        <Alert variant="destructive">
          <ShieldAlert className="h-4 w-4" />
          <AlertDescription>
            Only organization owners can manage API keys. Please contact an owner if you need
            access.
          </AlertDescription>
        </Alert>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="API Keys"
        description={`Manage API keys for ${currentOrg.name}`}
      />

      <div className="space-y-6">
          {/* Info Section */}
          <div className="rounded-lg border bg-card p-6">
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-primary/10 p-3">
                <Key className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-2">About API Keys</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  API keys enable programmatic access to ForgeStack for CI/CD integrations,
                  third-party tools, and automation. Each key can be scoped to specific
                  permissions following the principle of least privilege.
                </p>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Keys are shown only once upon creation</li>
                  <li>Store keys securely - treat them like passwords</li>
                  <li>Revoked keys stop working immediately</li>
                  <li>Use rotation to update keys without downtime</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Create Button */}
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Your API Keys</h2>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create API Key
            </Button>
          </div>

          {/* API Keys List */}
          {isKeysLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <ApiKeysList
              apiKeys={apiKeys}
              onRevoke={revokeKey}
              onRotate={handleRotateKey}
            />
          )}
      </div>

      {/* Create Dialog */}
      <CreateApiKeyDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onCreate={createKey}
      />

      {/* Rotated Key Display Dialog */}
      {rotatedKey && (
        <Dialog open={!!rotatedKey} onOpenChange={() => setRotatedKey(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>API Key Rotated</DialogTitle>
              <DialogDescription>
                A new API key has been generated. Make sure to copy it now.
              </DialogDescription>
            </DialogHeader>
            <ApiKeyDisplay apiKey={rotatedKey.key} keyName={rotatedKey.name} />
            <DialogFooter>
              <Button onClick={() => setRotatedKey(null)}>Done</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

