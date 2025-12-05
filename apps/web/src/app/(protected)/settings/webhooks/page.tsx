'use client';

/**
 * Webhooks Settings Page
 *
 * Allows organization owners to manage webhook endpoints and view delivery logs.
 * Only accessible to users with OWNER role.
 */

import { useState } from 'react';
import { useOrgContext } from '@/components/providers/org-provider';
import { useWebhookEndpoints, useWebhookDeliveries } from '@/hooks/use-webhooks';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WebhookEndpointsList } from '@/components/webhooks/webhook-endpoints-list';
import { WebhookEndpointDialog } from '@/components/webhooks/webhook-endpoint-dialog';
import { WebhookSecretDisplay } from '@/components/webhooks/webhook-secret-display';
import { WebhookDeliveriesTable } from '@/components/webhooks/webhook-deliveries-table';
import { DeliveryDetailsDialog } from '@/components/webhooks/delivery-details-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { XCircle, Webhook, Plus, ShieldAlert } from 'lucide-react';
import type { WebhookEndpoint, WebhookEndpointWithSecret, WebhookDelivery } from '@/types/webhooks';

export default function WebhooksPage() {
  const { currentOrg, isLoading: isOrgLoading } = useOrgContext();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingEndpoint, setEditingEndpoint] = useState<WebhookEndpoint | null>(null);
  const [createdEndpoint, setCreatedEndpoint] = useState<WebhookEndpointWithSecret | null>(null);
  const [selectedDelivery, setSelectedDelivery] = useState<WebhookDelivery | null>(null);

  const {
    endpoints,
    isLoading: isEndpointsLoading,
    error: endpointsError,
    createEndpoint,
    updateEndpoint,
    deleteEndpoint,
    testEndpoint,
    rotateSecret,
  } = useWebhookEndpoints({
    orgId: currentOrg?.id || '',
    autoFetch: !!currentOrg,
  });

  const {
    deliveries,
    isLoading: isDeliveriesLoading,
    error: deliveriesError,
    fetchDeliveries,
    retryDelivery,
  } = useWebhookDeliveries({
    orgId: currentOrg?.id || '',
    autoFetch: !!currentOrg,
  });

  const isOwner = currentOrg?.role === 'OWNER';

  // Handle endpoint creation - show the secret to user
  const handleCreateEndpoint = async (
    data: Parameters<typeof createEndpoint>[0]
  ): Promise<WebhookEndpointWithSecret> => {
    const newEndpoint = await createEndpoint(data);
    setCreatedEndpoint(newEndpoint);
    setIsCreateDialogOpen(false);
    return newEndpoint;
  };

  // Handle endpoint update
  const handleUpdateEndpoint = async (
    endpointId: string,
    data: Parameters<typeof updateEndpoint>[1]
  ): Promise<WebhookEndpoint> => {
    const updated = await updateEndpoint(endpointId, data);
    setEditingEndpoint(null);
    return updated;
  };

  // Handle toggle enabled
  const handleToggleEnabled = async (endpointId: string, enabled: boolean) => {
    await updateEndpoint(endpointId, { enabled });
  };

  // Handle test endpoint
  const handleTestEndpoint = async (endpointId: string) => {
    await testEndpoint(endpointId);
    // Refresh deliveries to show the new test delivery
    setTimeout(() => fetchDeliveries(), 1000);
  };

  if (isOrgLoading) {
    return (
      <>
        <PageHeader title="Webhooks" description="Loading..." />
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
          Please select an organization to view webhooks.
        </AlertDescription>
      </Alert>
    );
  }

  if (!isOwner) {
    return (
      <>
        <PageHeader
          title="Webhooks"
          description={`Webhooks for ${currentOrg.name}`}
        />
        <Alert variant="destructive">
          <ShieldAlert className="h-4 w-4" />
          <AlertDescription>
            Only organization owners can manage webhooks. Please contact an owner if you need
            access.
          </AlertDescription>
        </Alert>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Webhooks"
        description={`Manage webhooks for ${currentOrg.name}`}
      />

      <div className="space-y-6">
          {/* Info Section */}
          <div className="rounded-lg border bg-card p-6">
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-primary/10 p-3">
                <Webhook className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-2">About Webhooks</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Webhooks allow you to receive real-time notifications when events occur in your
                  organization. Configure endpoints to receive HTTP POST requests with event data.
                </p>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Webhook secrets are shown only once upon creation</li>
                  <li>Use the secret to verify webhook signatures</li>
                  <li>Disabled endpoints will not receive events</li>
                  <li>Failed deliveries can be retried manually</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Tabs for Endpoints and Deliveries */}
          <Tabs defaultValue="endpoints" className="space-y-6">
            <TabsList>
              <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
              <TabsTrigger value="deliveries">Recent Deliveries</TabsTrigger>
            </TabsList>

            {/* Endpoints Tab */}
            <TabsContent value="endpoints" className="space-y-6">
              {/* Error Alert */}
              {endpointsError && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>{endpointsError}</AlertDescription>
                </Alert>
              )}

              {/* Create Button */}
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Webhook Endpoints</h2>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Endpoint
                </Button>
              </div>

              {/* Endpoints List */}
              {isEndpointsLoading ? (
                <Skeleton className="h-64 w-full" />
              ) : (
                <WebhookEndpointsList
                  endpoints={endpoints}
                  onEdit={setEditingEndpoint}
                  onDelete={deleteEndpoint}
                  onTest={handleTestEndpoint}
                  onToggleEnabled={handleToggleEnabled}
                />
              )}
            </TabsContent>

            {/* Deliveries Tab */}
            <TabsContent value="deliveries" className="space-y-6">
              {/* Error Alert */}
              {deliveriesError && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>{deliveriesError}</AlertDescription>
                </Alert>
              )}

              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Recent Deliveries</h2>
                <Button variant="outline" onClick={fetchDeliveries}>
                  Refresh
                </Button>
              </div>

              {/* Deliveries Table */}
              {isDeliveriesLoading ? (
                <Skeleton className="h-64 w-full" />
              ) : (
                <WebhookDeliveriesTable
                  deliveries={deliveries}
                  onViewDetails={setSelectedDelivery}
                  onRetry={retryDelivery}
                />
              )}
            </TabsContent>
          </Tabs>
      </div>

      {/* Create Dialog */}
      <WebhookEndpointDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onCreate={handleCreateEndpoint}
      />

      {/* Edit Dialog */}
      {editingEndpoint && (
        <WebhookEndpointDialog
          open={!!editingEndpoint}
          onOpenChange={(open) => !open && setEditingEndpoint(null)}
          endpoint={editingEndpoint}
          onUpdate={handleUpdateEndpoint}
        />
      )}

      {/* Created Endpoint Secret Display Dialog */}
      {createdEndpoint && (
        <Dialog open={!!createdEndpoint} onOpenChange={() => setCreatedEndpoint(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Webhook Endpoint Created</DialogTitle>
              <DialogDescription>
                Your webhook endpoint has been created successfully. Make sure to copy the secret now.
              </DialogDescription>
            </DialogHeader>
            <WebhookSecretDisplay
              secret={createdEndpoint.secret}
              endpointId={createdEndpoint.id}
              onRotate={rotateSecret}
              showRotateButton={false}
            />
            <DialogFooter>
              <Button onClick={() => setCreatedEndpoint(null)}>Done</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delivery Details Dialog */}
      <DeliveryDetailsDialog
        delivery={selectedDelivery}
        open={!!selectedDelivery}
        onOpenChange={(open) => !open && setSelectedDelivery(null)}
        onRetry={retryDelivery}
      />
    </>
  );
}


