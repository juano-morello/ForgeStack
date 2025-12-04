/**
 * Quick Actions Component
 *
 * Displays quick action buttons for common tasks.
 */

import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Key, Webhook, CreditCard } from 'lucide-react';

interface QuickActionsProps {
  isOwner: boolean;
}

export function QuickActions({ isOwner }: QuickActionsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-2">
        <Button variant="outline" asChild>
          <Link href="/projects/new">
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/settings/api-keys">
            <Key className="mr-2 h-4 w-4" />
            API Keys
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/settings/webhooks">
            <Webhook className="mr-2 h-4 w-4" />
            Webhooks
          </Link>
        </Button>
        {isOwner && (
          <Button variant="outline" asChild>
            <Link href="/settings/billing">
              <CreditCard className="mr-2 h-4 w-4" />
              Billing
            </Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

