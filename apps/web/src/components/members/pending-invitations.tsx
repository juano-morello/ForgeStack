'use client';

/**
 * Pending Invitations Component
 *
 * Displays a list of pending invitations with the ability to cancel them.
 * Only visible to organization owners.
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Mail, X, Calendar } from 'lucide-react';
import type { Invitation } from '@/types/member';

interface PendingInvitationsProps {
  invitations: Invitation[];
  onCancel: (invitationId: string) => Promise<void>;
  isLoading?: boolean;
}

export function PendingInvitations({
  invitations,
  onCancel,
  isLoading = false,
}: PendingInvitationsProps) {
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const handleCancel = async (invitationId: string) => {
    if (!confirm('Are you sure you want to cancel this invitation?')) {
      return;
    }

    setCancellingId(invitationId);
    try {
      await onCancel(invitationId);
    } catch (err) {
      console.error('Failed to cancel invitation:', err);
    } finally {
      setCancellingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pending Invitations</CardTitle>
          <CardDescription>Invitations waiting to be accepted</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (invitations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pending Invitations</CardTitle>
          <CardDescription>Invitations waiting to be accepted</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Mail className="h-12 w-12 text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground">No pending invitations</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pending Invitations</CardTitle>
        <CardDescription>
          {invitations.length} {invitations.length === 1 ? 'invitation' : 'invitations'} waiting to be accepted
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {invitations.map((invitation) => (
            <div
              key={invitation.id}
              className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{invitation.email}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={invitation.role === 'OWNER' ? 'default' : 'secondary'} className="text-xs">
                      {invitation.role}
                    </Badge>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Expires {formatDate(invitation.expiresAt)}
                    </span>
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCancel(invitation.id)}
                disabled={cancellingId === invitation.id}
                className="ml-2"
              >
                {cancellingId === invitation.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <X className="h-4 w-4" />
                )}
                <span className="sr-only">Cancel invitation</span>
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

