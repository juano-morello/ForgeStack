'use client';

/**
 * Decline Invitation Client Component
 *
 * Client component that handles the invitation decline logic.
 * Uses hooks for URL params.
 */

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';

type PageState = 'initial' | 'confirming' | 'processing' | 'success' | 'error';

interface ErrorState {
  message: string;
}

export function DeclineInvitationClient() {
  const searchParams = useSearchParams();
  const [state, setState] = useState<PageState>('initial');
  const [error, setError] = useState<ErrorState | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    setToken(tokenParam);

    if (!tokenParam) {
      setState('error');
      setError({
        message: 'No invitation token provided',
      });
    } else {
      setState('confirming');
    }
  }, [searchParams]);

  const handleDecline = async () => {
    if (!token) {
      return;
    }

    setState('processing');

    try {
      const API_BASE =
        process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

      const response = await fetch(`${API_BASE}/invitations/decline`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          errorData = null;
        }

        if (response.status === 404) {
          setState('error');
          setError({
            message: 'Invitation not found or has already been used',
          });
        } else {
          setState('error');
          setError({
            message: errorData?.message || 'Failed to decline invitation',
          });
        }
        return;
      }

      setState('success');
    } catch {
      setState('error');
      setError({
        message: 'An unexpected error occurred. Please try again.',
      });
    }
  };

  const handleCancel = () => {
    // Just close the page or redirect to home
    window.close();
  };

  return (
    <Card className="shadow-lg">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold">Decline Invitation</CardTitle>
        <CardDescription>
          {state === 'confirming' &&
            'Are you sure you want to decline this invitation?'}
          {state === 'processing' && 'Processing your request...'}
          {state === 'success' && 'Invitation declined'}
          {state === 'error' && 'Unable to decline invitation'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <DeclineStateContent
          state={state}
          error={error}
          onDecline={handleDecline}
          onCancel={handleCancel}
        />
      </CardContent>
    </Card>
  );
}

interface DeclineStateContentProps {
  state: PageState;
  error: ErrorState | null;
  onDecline: () => void;
  onCancel: () => void;
}

function DeclineStateContent({
  state,
  error,
  onDecline,
  onCancel,
}: DeclineStateContentProps) {
  return (
    <div className="flex flex-col items-center justify-center py-8">
      {state === 'confirming' && (
        <>
          <AlertCircle className="h-16 w-16 text-amber-500 mb-4" />
          <p className="text-sm text-muted-foreground text-center mb-6">
            You are about to decline this organization invitation. This action
            cannot be undone. You will need to request a new invitation if you
            change your mind.
          </p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={onDecline}>
              Decline Invitation
            </Button>
          </div>
        </>
      )}

      {state === 'processing' && (
        <>
          <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
          <p className="text-sm text-muted-foreground">Please wait...</p>
        </>
      )}

      {state === 'success' && (
        <>
          <CheckCircle2 className="h-16 w-16 text-emerald-500 mb-4" />
          <p className="text-lg font-medium mb-2">Invitation Declined</p>
          <p className="text-sm text-muted-foreground text-center mb-6">
            You have successfully declined the invitation. You can close this
            page now.
          </p>
          <Button asChild variant="outline">
            <Link href="/">Go to Home</Link>
          </Button>
        </>
      )}

      {state === 'error' && error && (
        <>
          <XCircle className="h-16 w-16 text-destructive mb-4" />
          <p className="text-lg font-medium mb-2">Oops!</p>
          <p className="text-sm text-muted-foreground text-center mb-6">
            {error.message}
          </p>
          <Button asChild variant="outline">
            <Link href="/">Go to Home</Link>
          </Button>
        </>
      )}
    </div>
  );
}

