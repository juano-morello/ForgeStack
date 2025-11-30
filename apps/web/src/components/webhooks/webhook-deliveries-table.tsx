'use client';

/**
 * Webhook Deliveries Table Component
 *
 * Displays a table of webhook deliveries with status and actions.
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
import { RotateCw, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { EVENT_LABELS } from '@/lib/webhook-constants';
import type { WebhookDelivery } from '@/types/webhooks';

interface WebhookDeliveriesTableProps {
  deliveries: WebhookDelivery[];
  onViewDetails: (delivery: WebhookDelivery) => void;
  onRetry: (deliveryId: string) => Promise<{ message: string } | void>;
}

export function WebhookDeliveriesTable({
  deliveries,
  onViewDetails,
  onRetry,
}: WebhookDeliveriesTableProps) {
  const { toast } = useToast();
  const [retryingDeliveryId, setRetryingDeliveryId] = useState<string | null>(null);

  const handleRetryClick = async (deliveryId: string) => {
    if (retryingDeliveryId) return;

    setRetryingDeliveryId(deliveryId);
    try {
      await onRetry(deliveryId);
      toast({
        title: 'Delivery Retried',
        description: 'The webhook delivery has been retried.',
      });
    } catch (error) {
      toast({
        title: 'Failed to retry delivery',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setRetryingDeliveryId(null);
    }
  };

  const getStatusBadge = (delivery: WebhookDelivery) => {
    if (delivery.deliveredAt) {
      return <Badge variant="default">Delivered</Badge>;
    }
    if (delivery.failedAt) {
      return <Badge variant="destructive">Failed</Badge>;
    }
    return <Badge variant="secondary">Pending</Badge>;
  };

  if (deliveries.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg bg-muted/50">
        <p className="text-muted-foreground">No webhook deliveries yet.</p>
        <p className="text-sm text-muted-foreground mt-2">
          Deliveries will appear here when events are triggered.
        </p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Event</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Attempt</TableHead>
            <TableHead>Response</TableHead>
            <TableHead>Time</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {deliveries.map((delivery) => (
            <TableRow key={delivery.id}>
              <TableCell>
                <div>
                  <p className="font-medium text-sm">
                    {EVENT_LABELS[delivery.eventType]}
                  </p>
                  <p className="text-xs text-muted-foreground font-mono">
                    {delivery.eventId}
                  </p>
                </div>
              </TableCell>
              <TableCell>{getStatusBadge(delivery)}</TableCell>
              <TableCell className="text-sm">
                Attempt {delivery.attemptNumber}
              </TableCell>
              <TableCell>
                {delivery.responseStatus ? (
                  <Badge
                    variant={
                      delivery.responseStatus >= 200 && delivery.responseStatus < 300
                        ? 'default'
                        : 'destructive'
                    }
                  >
                    {delivery.responseStatus}
                  </Badge>
                ) : (
                  <span className="text-sm text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {delivery.deliveredAt
                  ? formatDistanceToNow(new Date(delivery.deliveredAt), { addSuffix: true })
                  : delivery.failedAt
                  ? formatDistanceToNow(new Date(delivery.failedAt), { addSuffix: true })
                  : formatDistanceToNow(new Date(delivery.createdAt), { addSuffix: true })}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onViewDetails(delivery)}
                    title="View details"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  {delivery.failedAt && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRetryClick(delivery.id)}
                      disabled={retryingDeliveryId === delivery.id}
                      title="Retry delivery"
                    >
                      <RotateCw className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

