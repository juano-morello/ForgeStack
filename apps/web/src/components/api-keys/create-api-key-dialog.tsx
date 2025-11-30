'use client';

/**
 * Create API Key Dialog Component
 *
 * Form dialog for creating a new API key.
 * Shows the generated key after successful creation.
 */

import { useState, FormEvent } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { ScopeSelector } from './scope-selector';
import { ApiKeyDisplay } from './api-key-display';
import type { ApiKeyCreated, CreateApiKeyRequest, ApiKeyScope } from '@/types/api-keys';

interface CreateApiKeyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (data: CreateApiKeyRequest) => Promise<ApiKeyCreated>;
}

export function CreateApiKeyDialog({ open, onOpenChange, onCreate }: CreateApiKeyDialogProps) {
  const [name, setName] = useState('');
  const [scopes, setScopes] = useState<ApiKeyScope[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [createdKey, setCreatedKey] = useState<ApiKeyCreated | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate name
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('API key name is required');
      return;
    }

    // Validate scopes
    if (scopes.length === 0) {
      setError('Please select at least one scope');
      return;
    }

    setIsLoading(true);

    try {
      const newKey = await onCreate({
        name: trimmedName,
        scopes,
      });

      setCreatedKey(newKey);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create API key';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onOpenChange(false);
      // Reset form after a short delay to avoid visual glitch
      setTimeout(() => {
        setName('');
        setScopes([]);
        setError(null);
        setCreatedKey(null);
      }, 200);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        {!createdKey ? (
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Create API Key</DialogTitle>
              <DialogDescription>
                Create a new API key for programmatic access to your organization.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {error && (
                <div className="rounded-md bg-destructive/10 p-4">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              {/* Name Input */}
              <div className="space-y-2">
                <Label htmlFor="name">
                  Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., CI/CD Pipeline, Production Server"
                  maxLength={255}
                  disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground">
                  A descriptive name to identify this key
                </p>
              </div>

              {/* Scope Selector */}
              <div className="space-y-2">
                <Label>
                  Scopes <span className="text-destructive">*</span>
                </Label>
                <p className="text-xs text-muted-foreground mb-3">
                  Select the permissions this API key should have
                </p>
                <ScopeSelector
                  selectedScopes={scopes}
                  onChange={setScopes}
                  disabled={isLoading}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Create API Key
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>API Key Created</DialogTitle>
              <DialogDescription>
                Your API key has been created successfully. Copy it now - you won&apos;t be able to
                see it again.
              </DialogDescription>
            </DialogHeader>

            <div className="py-4">
              <ApiKeyDisplay apiKey={createdKey.key} keyName={createdKey.name} />
            </div>

            <DialogFooter>
              <Button type="button" onClick={handleClose}>
                Done
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

