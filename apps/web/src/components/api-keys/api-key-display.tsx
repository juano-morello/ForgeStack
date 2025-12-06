'use client';

/**
 * API Key Display Component
 *
 * Shows the full API key immediately after creation.
 * Includes copy to clipboard functionality and warning message.
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Copy, Check, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ApiKeyDisplayProps {
  apiKey: string;
  keyName: string;
}

export function ApiKeyDisplay({ apiKey, keyName }: ApiKeyDisplayProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(apiKey);
      setCopied(true);
      toast({
        title: 'Copied!',
        description: 'API key copied to clipboard',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: 'Failed to copy',
        description: 'Please copy the key manually',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Warning Alert */}
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Important:</strong> This key will only be shown once. Make sure to copy it now
          and store it securely.
        </AlertDescription>
      </Alert>

      {/* Key Display */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          API Key for &quot;{keyName}&quot;
        </label>
        <div className="flex gap-2">
          <div className="flex-1 rounded-md border bg-muted px-3 py-2 font-mono text-sm break-all">
            {apiKey}
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleCopy}
            className="shrink-0"
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-600" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
            <span className="sr-only">Copy API key</span>
          </Button>
        </div>
      </div>

      {/* Instructions */}
      <div className="rounded-md bg-muted p-4 text-sm text-muted-foreground">
        <p className="font-medium text-foreground mb-2">How to use this key:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Include it in the <code className="text-xs bg-background px-1 py-0.5 rounded">X-API-Key</code> header</li>
          <li>Or use <code className="text-xs bg-background px-1 py-0.5 rounded">Authorization: Bearer {'{key}'}</code></li>
          <li>Store it securely - treat it like a password</li>
          <li>Never commit it to version control</li>
        </ul>
      </div>
    </div>
  );
}

