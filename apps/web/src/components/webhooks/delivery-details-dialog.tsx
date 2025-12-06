'use client';

/**
 * Delivery Details Dialog Component
 *
 * Shows detailed information about a webhook delivery.
 */

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { RotateCw, Copy, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { EVENT_LABELS } from '@/lib/webhook-constants';
import type { WebhookDelivery } from '@/types/webhooks';

interface DeliveryDetailsDialogProps {
  delivery: WebhookDelivery | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRetry?: (deliveryId: string) => Promise<{ message: string } | void>;
}

export function DeliveryDetailsDialog({
  delivery,
  open,
  onOpenChange,
  onRetry,
}: DeliveryDetailsDialogProps) {
  const { toast } = useToast();
  const [isRetrying, setIsRetrying] = useState(false);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  if (!delivery) return null;

  const handleCopy = async (text: string, section: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedSection(section);
      toast({
        title: 'Copied to clipboard',
        description: `${section} has been copied.`,
      });
      setTimeout(() => setCopiedSection(null), 2000);
    } catch {
      toast({
        title: 'Failed to copy',
        description: 'Could not copy to clipboard.',
        variant: 'destructive',
      });
    }
  };

  const handleRetry = async () => {
    if (!onRetry) return;

    setIsRetrying(true);
    try {
      await onRetry(delivery.id);
      toast({
        title: 'Delivery Retried',
        description: 'The webhook delivery has been retried.',
      });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Failed to retry delivery',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsRetrying(false);
    }
  };

  const getStatusBadge = () => {
    if (delivery.deliveredAt) {
      return <Badge variant="default">Delivered</Badge>;
    }
    if (delivery.failedAt) {
      return <Badge variant="destructive">Failed</Badge>;
    }
    return <Badge variant="secondary">Pending</Badge>;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Webhook Delivery Details</DialogTitle>
          <DialogDescription>
            Detailed information about this webhook delivery attempt.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status and Event Info */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Status</Label>
                <div className="mt-1">{getStatusBadge()}</div>
              </div>
              <div>
                <Label>Attempt Number</Label>
                <p className="text-sm mt-1">Attempt {delivery.attemptNumber}</p>
              </div>
              {delivery.responseStatus && (
                <div>
                  <Label>Response Status</Label>
                  <div className="mt-1">
                    <Badge
                      variant={
                        delivery.responseStatus >= 200 && delivery.responseStatus < 300
                          ? 'default'
                          : 'destructive'
                      }
                    >
                      {delivery.responseStatus}
                    </Badge>
                  </div>
                </div>
              )}
            </div>

            <div>
              <Label>Event Type</Label>
              <p className="text-sm mt-1">{EVENT_LABELS[delivery.eventType]}</p>
            </div>

            <div>
              <Label>Event ID</Label>
              <div className="flex items-center gap-2 mt-1">
                <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                  {delivery.eventId}
                </code>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => handleCopy(delivery.eventId, 'Event ID')}
                >
                  {copiedSection === 'Event ID' ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          <Separator />

          {/* Request Payload */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Request Payload</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCopy(JSON.stringify(delivery.payload, null, 2), 'Payload')}
              >
                {copiedSection === 'Payload' ? (
                  <>
                    <Check className="h-3 w-3 mr-1" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3 mr-1" />
                    Copy
                  </>
                )}
              </Button>
            </div>
            <pre className="text-xs bg-muted p-4 rounded-lg overflow-x-auto max-h-[300px]">
              {JSON.stringify(delivery.payload, null, 2)}
            </pre>
          </div>

          {/* Response Body */}
          {delivery.responseBody && (
            <>
              <Separator />
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Response Body</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy(delivery.responseBody || '', 'Response')}
                  >
                    {copiedSection === 'Response' ? (
                      <>
                        <Check className="h-3 w-3 mr-1" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3 mr-1" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
                <pre className="text-xs bg-muted p-4 rounded-lg overflow-x-auto max-h-[200px]">
                  {delivery.responseBody}
                </pre>
              </div>
            </>
          )}

          {/* Error Message */}
          {delivery.error && (
            <>
              <Separator />
              <div>
                <Label>Error Message</Label>
                <div className="mt-2 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <p className="text-sm text-destructive">{delivery.error}</p>
                </div>
              </div>
            </>
          )}

          {/* Timestamps */}
          <Separator />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Created At</Label>
              <p className="text-sm mt-1">
                {new Date(delivery.createdAt).toLocaleString()}
              </p>
            </div>
            {delivery.deliveredAt && (
              <div>
                <Label>Delivered At</Label>
                <p className="text-sm mt-1">
                  {new Date(delivery.deliveredAt).toLocaleString()}
                </p>
              </div>
            )}
            {delivery.failedAt && (
              <div>
                <Label>Failed At</Label>
                <p className="text-sm mt-1">
                  {new Date(delivery.failedAt).toLocaleString()}
                </p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {delivery.failedAt && onRetry && (
            <Button onClick={handleRetry} disabled={isRetrying}>
              <RotateCw className="h-4 w-4 mr-2" />
              {isRetrying ? 'Retrying...' : 'Retry Delivery'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


