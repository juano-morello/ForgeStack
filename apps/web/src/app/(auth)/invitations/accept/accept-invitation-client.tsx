'use client';

/**
 * Accept Invitation Client Component
 *
 * Client component that handles the invitation acceptance logic.
 * Uses hooks for session management and URL params.
 */

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { useSession } from '@/lib/auth-client';
import { api, ApiError } from '@/lib/api';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { AcceptedInvitationResponse } from '@/types/member';

type PageState = 'loading' | 'success' | 'error' | 'not-authenticated';

interface ErrorState {
  message: string;
  action?: {
    label: string;
    href: string;
  };
}

export function AcceptInvitationClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, isPending: sessionLoading } = useSession();

  const [state, setState] = useState<PageState>('loading');
  const [error, setError] = useState<ErrorState | null>(null);
  const [orgData, setOrgData] = useState<AcceptedInvitationResponse | null>(
    null
  );

  useEffect(() => {
    const acceptInvitation = async () => {
      // Wait for session to load
      if (sessionLoading) {
        return;
      }

      // Check if user is authenticated
      if (!session?.user) {
        setState('not-authenticated');
        // Redirect to login with return URL
        const token = searchParams.get('token');
        const returnUrl = token
          ? `/invitations/accept?token=${token}`
          : '/invitations/accept';
        router.push(`/login?callbackUrl=${encodeURIComponent(returnUrl)}`);
        return;
      }

      const token = searchParams.get('token');

      if (!token) {
        setState('error');
        setError({
          message: 'No invitation token provided',
          action: {
            label: 'Go to Dashboard',
            href: '/dashboard',
          },
        });
        return;
      }

      try {
        setState('loading');
        const response = await api.post<AcceptedInvitationResponse>(
          '/invitations/accept',
          { token }
        );

        setOrgData(response);
        setState('success');

        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          router.push('/dashboard');
          router.refresh();
        }, 2000);
      } catch (err) {
        setState('error');

        if (err instanceof ApiError) {
          // Handle specific error cases
          if (err.status === 404) {
            setError({
              message: 'Invitation not found or has expired',
              action: {
                label: 'Contact Organization',
                href: '/dashboard',
              },
            });
          } else if (err.status === 409) {
            setError({
              message: 'You are already a member of this organization',
              action: {
                label: 'Go to Dashboard',
                href: '/dashboard',
              },
            });
          } else if (err.status === 403) {
            setError({
              message: 'This invitation was sent to a different email address',
              action: {
                label: 'Go to Dashboard',
                href: '/dashboard',
              },
            });
          } else {
            setError({
              message: err.message || 'Failed to accept invitation',
              action: {
                label: 'Try Again',
                href: window.location.href,
              },
            });
          }
        } else {
          setError({
            message: 'An unexpected error occurred',
            action: {
              label: 'Go to Dashboard',
              href: '/dashboard',
            },
          });
        }
      }
    };

    acceptInvitation();
  }, [session, sessionLoading, searchParams, router]);

  return (
    <Card className="shadow-lg">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold">Accept Invitation</CardTitle>
        <CardDescription>
          {state === 'loading' && 'Processing your invitation...'}
          {state === 'success' && 'Invitation accepted successfully!'}
          {state === 'error' && 'Unable to accept invitation'}
          {state === 'not-authenticated' && 'Redirecting to login...'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center py-8">
          {state === 'loading' && (
            <>
              <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
              <p className="text-sm text-muted-foreground">
                Please wait while we process your invitation...
              </p>
            </>
          )}

          {state === 'success' && orgData && (
            <>
              <CheckCircle2 className="h-16 w-16 text-emerald-500 mb-4" />
              <p className="text-lg font-medium mb-2">Welcome aboard!</p>
              <p className="text-sm text-muted-foreground text-center mb-4">
                You have been added to{' '}
                <strong>{orgData.organization.name}</strong> as a{' '}
                <strong>{orgData.role}</strong>.
              </p>
              <p className="text-xs text-muted-foreground">
                Redirecting to dashboard...
              </p>
            </>
          )}

          {state === 'error' && error && (
            <>
              {error.message.includes('expired') ? (
                <AlertCircle className="h-16 w-16 text-amber-500 mb-4" />
              ) : (
                <XCircle className="h-16 w-16 text-destructive mb-4" />
              )}
              <p className="text-lg font-medium mb-2">Oops!</p>
              <p className="text-sm text-muted-foreground text-center mb-6">
                {error.message}
              </p>
              {error.action && (
                <Button asChild>
                  <Link href={error.action.href}>{error.action.label}</Link>
                </Button>
              )}
            </>
          )}

          {state === 'not-authenticated' && (
            <>
              <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
              <p className="text-sm text-muted-foreground">
                Redirecting to login...
              </p>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

