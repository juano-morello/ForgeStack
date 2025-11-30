'use client';

/**
 * Webhook Endpoint Dialog Component
 *
 * Dialog for creating or editing webhook endpoints.
 */

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { EventSelector } from './event-selector';
import { useToast } from '@/hooks/use-toast';
import type {
  WebhookEndpoint,
  WebhookEndpointWithSecret,
  CreateWebhookEndpointRequest,
  UpdateWebhookEndpointRequest,
  WebhookEventType,
} from '@/types/webhooks';

interface WebhookEndpointDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  endpoint?: WebhookEndpoint;
  onCreate?: (data: CreateWebhookEndpointRequest) => Promise<WebhookEndpointWithSecret>;
  onUpdate?: (endpointId: string, data: UpdateWebhookEndpointRequest) => Promise<WebhookEndpoint>;
}

export function WebhookEndpointDialog({
  open,
  onOpenChange,
  endpoint,
  onCreate,
  onUpdate,
}: WebhookEndpointDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [selectedEvents, setSelectedEvents] = useState<WebhookEventType[]>([]);
  const [enabled, setEnabled] = useState(true);

  const isEditMode = !!endpoint;

  // Initialize form with endpoint data when editing
  useEffect(() => {
    if (endpoint) {
      setUrl(endpoint.url);
      setDescription(endpoint.description || '');
      setSelectedEvents(endpoint.events);
      setEnabled(endpoint.enabled);
    } else {
      setUrl('');
      setDescription('');
      setSelectedEvents([]);
      setEnabled(true);
    }
  }, [endpoint, open]);

  const validateUrl = (url: string): boolean => {
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'https:';
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!url.trim()) {
      toast({
        title: 'URL Required',
        description: 'Please enter a webhook URL.',
        variant: 'destructive',
      });
      return;
    }

    if (!validateUrl(url)) {
      toast({
        title: 'Invalid URL',
        description: 'Please enter a valid HTTPS URL.',
        variant: 'destructive',
      });
      return;
    }

    if (selectedEvents.length === 0) {
      toast({
        title: 'Events Required',
        description: 'Please select at least one event.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      if (isEditMode && onUpdate && endpoint) {
        await onUpdate(endpoint.id, {
          url,
          description: description || undefined,
          events: selectedEvents,
          enabled,
        });
        toast({
          title: 'Endpoint Updated',
          description: 'Webhook endpoint has been updated successfully.',
        });
      } else if (onCreate) {
        await onCreate({
          url,
          description: description || undefined,
          events: selectedEvents,
          enabled,
        });
        toast({
          title: 'Endpoint Created',
          description: 'Webhook endpoint has been created successfully.',
        });
      }
      onOpenChange(false);
    } catch (error) {
      toast({
        title: isEditMode ? 'Failed to update endpoint' : 'Failed to create endpoint',
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
          <DialogTitle>{isEditMode ? 'Edit Webhook Endpoint' : 'Create Webhook Endpoint'}</DialogTitle>
          <DialogDescription>
            {isEditMode
              ? 'Update the webhook endpoint configuration.'
              : 'Configure a new webhook endpoint to receive events.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="url">
              Webhook URL <span className="text-destructive">*</span>
            </Label>
            <Input
              id="url"
              type="url"
              placeholder="https://example.com/webhooks"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              Must be a valid HTTPS URL
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Optional description for this webhook endpoint"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>
              Events <span className="text-destructive">*</span>
            </Label>
            <div className="border rounded-lg p-4 max-h-[300px] overflow-y-auto">
              <EventSelector
                selectedEvents={selectedEvents}
                onChange={setSelectedEvents}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Select the events you want to receive
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="enabled"
              checked={enabled}
              onCheckedChange={(checked) => setEnabled(checked as boolean)}
            />
            <Label htmlFor="enabled" className="font-normal cursor-pointer">
              Enable this endpoint
            </Label>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : isEditMode ? 'Update Endpoint' : 'Create Endpoint'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}


