'use client';

/**
 * Revoke API Key Dialog Component
 *
 * Confirmation dialog for revoking an API key.
 * Warns about permanent revocation.
 */

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
import { AlertTriangle, Loader2 } from 'lucide-react';
import type { ApiKey } from '@/types/api-keys';

interface RevokeApiKeyDialogProps {
  apiKey: ApiKey | null;
  isOpen: boolean;
  isRevoking: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function RevokeApiKeyDialog({
  apiKey,
  isOpen,
  isRevoking,
  onClose,
  onConfirm,
}: RevokeApiKeyDialogProps) {
  if (!apiKey) {
    return null;
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && !isRevoking && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-destructive/10 p-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <AlertDialogTitle>Revoke API Key</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="pt-3">
            Are you sure you want to revoke the API key{' '}
            <span className="font-semibold text-foreground">&quot;{apiKey.name}&quot;</span>?
            <br />
            <br />
            This action is <strong>permanent</strong> and cannot be undone. Any applications or
            scripts using this key will immediately stop working.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isRevoking}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            disabled={isRevoking}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isRevoking && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Revoke Key
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

