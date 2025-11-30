'use client';

/**
 * Webhook Endpoints List Component
 *
 * Displays a table of webhook endpoints with actions.
 */

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { Trash2, Edit, TestTube, ToggleLeft, ToggleRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { EVENT_LABELS } from '@/lib/webhook-constants';
import type { WebhookEndpoint } from '@/types/webhooks';

interface WebhookEndpointsListProps {
  endpoints: WebhookEndpoint[];
  onEdit: (endpoint: WebhookEndpoint) => void;
  onDelete: (endpointId: string) => Promise<void>;
  onTest: (endpointId: string) => Promise<void>;
  onToggleEnabled: (endpointId: string, enabled: boolean) => Promise<void>;
}

export function WebhookEndpointsList({
  endpoints,
  onEdit,
  onDelete,
  onTest,
  onToggleEnabled,
}: WebhookEndpointsListProps) {
  const { toast } = useToast();
  const [endpointToDelete, setEndpointToDelete] = useState<WebhookEndpoint | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [testingEndpointId, setTestingEndpointId] = useState<string | null>(null);
  const [togglingEndpointId, setTogglingEndpointId] = useState<string | null>(null);

  const handleDeleteClick = (endpoint: WebhookEndpoint) => {
    setEndpointToDelete(endpoint);
  };

  const handleConfirmDelete = async () => {
    if (!endpointToDelete) return;

    setIsDeleting(true);
    try {
      await onDelete(endpointToDelete.id);
      toast({
        title: 'Endpoint Deleted',
        description: 'Webhook endpoint has been deleted successfully.',
      });
      setEndpointToDelete(null);
    } catch (error) {
      toast({
        title: 'Failed to delete endpoint',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleTestClick = async (endpointId: string) => {
    if (testingEndpointId) return;

    setTestingEndpointId(endpointId);
    try {
      await onTest(endpointId);
      toast({
        title: 'Test Sent',
        description: 'A test ping event has been sent to the endpoint.',
      });
    } catch (error) {
      toast({
        title: 'Failed to test endpoint',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setTestingEndpointId(null);
    }
  };

  const handleToggleEnabled = async (endpointId: string, currentEnabled: boolean) => {
    if (togglingEndpointId) return;

    setTogglingEndpointId(endpointId);
    try {
      await onToggleEnabled(endpointId, !currentEnabled);
      toast({
        title: currentEnabled ? 'Endpoint Disabled' : 'Endpoint Enabled',
        description: `Webhook endpoint has been ${currentEnabled ? 'disabled' : 'enabled'}.`,
      });
    } catch (error) {
      toast({
        title: 'Failed to toggle endpoint',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setTogglingEndpointId(null);
    }
  };

  if (endpoints.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg bg-muted/50">
        <p className="text-muted-foreground">No webhook endpoints configured yet.</p>
        <p className="text-sm text-muted-foreground mt-2">
          Create your first endpoint to start receiving webhook events.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>URL</TableHead>
              <TableHead>Events</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {endpoints.map((endpoint) => (
              <TableRow key={endpoint.id}>
                <TableCell className="font-mono text-sm max-w-xs truncate">
                  {endpoint.url}
                  {endpoint.description && (
                    <p className="text-xs text-muted-foreground mt-1 font-normal">
                      {endpoint.description}
                    </p>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {endpoint.events.slice(0, 3).map((event) => (
                      <Badge key={event} variant="secondary" className="text-xs">
                        {EVENT_LABELS[event]}
                      </Badge>
                    ))}
                    {endpoint.events.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{endpoint.events.length - 3} more
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={endpoint.enabled ? 'default' : 'secondary'}>
                    {endpoint.enabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(endpoint.createdAt), { addSuffix: true })}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleToggleEnabled(endpoint.id, endpoint.enabled)}
                      disabled={togglingEndpointId === endpoint.id}
                      title={endpoint.enabled ? 'Disable' : 'Enable'}
                    >
                      {endpoint.enabled ? (
                        <ToggleRight className="h-4 w-4" />
                      ) : (
                        <ToggleLeft className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleTestClick(endpoint.id)}
                      disabled={testingEndpointId === endpoint.id}
                      title="Test endpoint"
                    >
                      <TestTube className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(endpoint)}
                      title="Edit endpoint"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteClick(endpoint)}
                      title="Delete endpoint"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!endpointToDelete} onOpenChange={() => setEndpointToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Webhook Endpoint?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the webhook endpoint &quot;{endpointToDelete?.url}&quot;.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}


