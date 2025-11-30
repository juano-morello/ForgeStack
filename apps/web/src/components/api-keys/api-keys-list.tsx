'use client';

/**
 * API Keys List Component
 *
 * Displays a table of API keys with actions.
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
import { ScopeBadge } from './scope-badge';
import { RevokeApiKeyDialog } from './revoke-api-key-dialog';
import { Trash2, RotateCw, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { ApiKey } from '@/types/api-keys';

interface ApiKeysListProps {
  apiKeys: ApiKey[];
  onRevoke: (keyId: string) => Promise<void>;
  onRotate: (keyId: string) => Promise<void>;
}

export function ApiKeysList({ apiKeys, onRevoke, onRotate }: ApiKeysListProps) {
  const { toast } = useToast();
  const [keyToRevoke, setKeyToRevoke] = useState<ApiKey | null>(null);
  const [isRevoking, setIsRevoking] = useState(false);
  const [rotatingKeyId, setRotatingKeyId] = useState<string | null>(null);

  const handleRevokeClick = (key: ApiKey) => {
    setKeyToRevoke(key);
  };

  const handleConfirmRevoke = async () => {
    if (!keyToRevoke) return;

    setIsRevoking(true);
    try {
      await onRevoke(keyToRevoke.id);
      toast({
        title: 'API Key Revoked',
        description: `"${keyToRevoke.name}" has been revoked successfully.`,
      });
      setKeyToRevoke(null);
    } catch (error) {
      toast({
        title: 'Failed to revoke key',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsRevoking(false);
    }
  };

  const handleRotateClick = async (key: ApiKey) => {
    if (rotatingKeyId) return;

    setRotatingKeyId(key.id);
    try {
      await onRotate(key.id);
      toast({
        title: 'API Key Rotated',
        description: `"${key.name}" has been rotated. Make sure to update your applications with the new key.`,
      });
    } catch (error) {
      toast({
        title: 'Failed to rotate key',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setRotatingKeyId(null);
    }
  };

  if (apiKeys.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-12 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No API Keys</h3>
        <p className="text-sm text-muted-foreground mb-4">
          You haven&apos;t created any API keys yet. Create one to get started with programmatic
          access.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Key Prefix</TableHead>
              <TableHead>Scopes</TableHead>
              <TableHead>Last Used</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {apiKeys.map((key) => (
              <TableRow key={key.id}>
                <TableCell className="font-medium">{key.name}</TableCell>
                <TableCell>
                  <code className="text-xs bg-muted px-2 py-1 rounded">{key.keyPrefix}...</code>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {key.scopes.slice(0, 3).map((scope) => (
                      <ScopeBadge key={scope} scope={scope} />
                    ))}
                    {key.scopes.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{key.scopes.length - 3} more
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {key.lastUsedAt
                    ? formatDistanceToNow(new Date(key.lastUsedAt), { addSuffix: true })
                    : 'Never'}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(key.createdAt), { addSuffix: true })}
                </TableCell>
                <TableCell>
                  {key.isRevoked ? (
                    <Badge variant="destructive">Revoked</Badge>
                  ) : key.expiresAt && new Date(key.expiresAt) < new Date() ? (
                    <Badge variant="destructive">Expired</Badge>
                  ) : (
                    <Badge variant="secondary">Active</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRotateClick(key)}
                      disabled={key.isRevoked || rotatingKeyId === key.id}
                      title="Rotate key"
                    >
                      <RotateCw className={`h-4 w-4 ${rotatingKeyId === key.id ? 'animate-spin' : ''}`} />
                      <span className="sr-only">Rotate</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRevokeClick(key)}
                      disabled={key.isRevoked}
                      title="Revoke key"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                      <span className="sr-only">Revoke</span>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <RevokeApiKeyDialog
        apiKey={keyToRevoke}
        isOpen={!!keyToRevoke}
        isRevoking={isRevoking}
        onClose={() => setKeyToRevoke(null)}
        onConfirm={handleConfirmRevoke}
      />
    </>
  );
}

