import { Suspense } from 'react';
import { headers } from 'next/headers';
import { Loader2 } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { AcceptInvitationClient } from './accept-invitation-client';

// Force dynamic rendering to prevent static generation issues with auth hooks
export const dynamic = 'force-dynamic';

/**
 * Accept Invitation Page
 *
 * Allows authenticated users to accept organization invitations via token.
 * Uses force-dynamic to prevent prerendering issues with auth hooks.
 */
export default async function AcceptInvitationPage() {
  // Access headers to ensure this is treated as a dynamic route
  await headers();

  return (
    <Suspense
      fallback={
        <Card className="shadow-lg">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold">Accept Invitation</CardTitle>
            <CardDescription>Loading...</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
            </div>
          </CardContent>
        </Card>
      }
    >
      <AcceptInvitationClient />
    </Suspense>
  );
}

