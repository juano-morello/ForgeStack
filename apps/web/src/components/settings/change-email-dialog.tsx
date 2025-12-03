'use client';

/**
 * Change Email Dialog Component
 *
 * Modal dialog for requesting an email change with password verification.
 * Sends a verification email to the new address.
 */

import { useState, FormEvent } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Mail, CheckCircle2 } from 'lucide-react';
import { userApi } from '@/lib/api';

interface ChangeEmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentEmail: string;
}

export function ChangeEmailDialog({
  open,
  onOpenChange,
  currentEmail,
}: ChangeEmailDialogProps) {
  const { toast } = useToast();
  const [newEmail, setNewEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate new email
    const trimmedEmail = newEmail.trim().toLowerCase();
    if (!trimmedEmail) {
      setError('New email is required');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setError('Please enter a valid email address');
      return;
    }

    // Check if email is the same as current
    if (trimmedEmail === currentEmail.toLowerCase()) {
      setError('New email must be different from current email');
      return;
    }

    // Validate password
    if (!password) {
      setError('Current password is required');
      return;
    }

    setIsLoading(true);

    try {
      await userApi.requestEmailChange({
        newEmail: trimmedEmail,
        password,
      });

      setIsSuccess(true);
      toast({
        title: 'Verification email sent',
        description: `Please check ${trimmedEmail} for a verification link.`,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to request email change';
      setError(message);
      toast({
        title: 'Email change failed',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen);
    if (!newOpen) {
      // Reset form when closing
      setNewEmail('');
      setPassword('');
      setError(null);
      setIsSuccess(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Change Email Address</DialogTitle>
          <DialogDescription>
            Enter your new email address and current password. You'll need to verify the new email before it becomes active.
          </DialogDescription>
        </DialogHeader>

        {isSuccess ? (
          <div className="py-6">
            <Alert className="border-green-500/50 bg-green-500/10">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <AlertDescription className="text-green-700 dark:text-green-400">
                <strong>Verification email sent!</strong>
                <p className="mt-2 text-sm">
                  Please check your inbox at <strong>{newEmail}</strong> and click the verification link to complete the email change.
                </p>
              </AlertDescription>
            </Alert>
            <div className="mt-4 flex justify-end">
              <Button onClick={() => handleOpenChange(false)}>
                Close
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="grid gap-2">
                <Label htmlFor="current-email">Current Email</Label>
                <Input
                  id="current-email"
                  type="email"
                  value={currentEmail}
                  disabled
                  className="bg-muted"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="new-email">
                  New Email <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="new-email"
                  type="email"
                  placeholder="newemail@example.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  disabled={isLoading}
                  autoFocus
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="password">
                  Current Password <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your current password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground">
                  Required for security verification
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                <Mail className="h-4 w-4 mr-2" />
                Send Verification Email
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

