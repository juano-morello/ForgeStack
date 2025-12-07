'use client';

/**
 * ImpersonationBanner Component
 *
 * Fixed banner that appears at the top of the screen when impersonating a user.
 * Shows impersonated user info, remaining time, and exit button.
 */

import { Eye, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { ImpersonationSession } from '@/lib/api';

interface ImpersonationBannerProps {
  session: ImpersonationSession;
  remainingTime: number;
  onEndImpersonation: () => void;
}

function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  }
  if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  }
  return `${secs}s`;
}

export function ImpersonationBanner({
  session,
  remainingTime,
  onEndImpersonation,
}: ImpersonationBannerProps) {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 border-b border-amber-600 bg-amber-500 shadow-md">
      <Alert className="rounded-none border-0 bg-transparent">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Eye className="h-5 w-5 text-amber-900" />
            <AlertDescription className="text-sm font-medium text-amber-900">
              <span className="font-semibold">Impersonating:</span>{' '}
              {session.targetUser.name || session.targetUser.email}
              {session.targetUser.name && (
                <span className="ml-2 text-amber-800">({session.targetUser.email})</span>
              )}
            </AlertDescription>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-sm font-medium text-amber-900">
              Time remaining: <span className="font-mono">{formatTime(remainingTime)}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onEndImpersonation}
              className="border-amber-700 bg-amber-600 text-white hover:bg-amber-700 hover:text-white"
            >
              <X className="mr-2 h-4 w-4" />
              Exit Impersonation
            </Button>
          </div>
        </div>
      </Alert>
    </div>
  );
}

