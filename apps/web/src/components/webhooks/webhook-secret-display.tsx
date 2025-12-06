'use client';

/**
 * Webhook Secret Display Component
 *
 * Displays webhook secret with copy functionality and rotation option.
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Copy, Check, RotateCw, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface WebhookSecretDisplayProps {
  secret: string;
  endpointId?: string;
  onRotate?: (endpointId: string) => Promise<{ secret: string }>;
  showRotateButton?: boolean;
}

export function WebhookSecretDisplay({
  secret,
  endpointId,
  onRotate,
  showRotateButton = false,
}: WebhookSecretDisplayProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [currentSecret, setCurrentSecret] = useState(secret);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentSecret);
      setCopied(true);
      toast({
        title: 'Copied to clipboard',
        description: 'Webhook secret has been copied.',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: 'Failed to copy',
        description: 'Could not copy to clipboard.',
        variant: 'destructive',
      });
    }
  };

  const handleRotate = async () => {
    if (!endpointId || !onRotate) return;

    setIsRotating(true);
    try {
      const result = await onRotate(endpointId);
      setCurrentSecret(result.secret);
      toast({
        title: 'Secret Rotated',
        description: 'A new webhook secret has been generated. Make sure to update your endpoint configuration.',
      });
    } catch (error) {
      toast({
        title: 'Failed to rotate secret',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsRotating(false);
    }
  };

  return (
    <div className="space-y-4">
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          This secret is shown only once. Make sure to copy it and store it securely.
          You&apos;ll need it to verify webhook signatures.
        </AlertDescription>
      </Alert>

      <div className="space-y-2">
        <Label htmlFor="webhook-secret">Webhook Secret</Label>
        <div className="flex gap-2">
          <Input
            id="webhook-secret"
            value={currentSecret}
            readOnly
            className="font-mono text-sm"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleCopy}
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {showRotateButton && endpointId && onRotate && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button type="button" variant="outline" disabled={isRotating}>
              <RotateCw className="h-4 w-4 mr-2" />
              Rotate Secret
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Rotate Webhook Secret?</AlertDialogTitle>
              <AlertDialogDescription>
                This will generate a new secret and invalidate the old one. You&apos;ll need to update
                your webhook endpoint configuration with the new secret. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleRotate}>
                Rotate Secret
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}

