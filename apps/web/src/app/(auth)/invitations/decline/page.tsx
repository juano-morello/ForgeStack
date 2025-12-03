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
import { DeclineInvitationClient } from './decline-invitation-client';

// Force dynamic rendering to prevent static generation issues
export const dynamic = 'force-dynamic';

/**
 * Decline Invitation Page
 *
 * Allows users to decline organization invitations via token.
 * This is a public page - no authentication required.
 */
export default async function DeclineInvitationPage() {
  // Access headers to ensure this is treated as a dynamic route
  await headers();

  return (
    <Suspense
      fallback={
        <Card className="shadow-lg">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold">Decline Invitation</CardTitle>
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
      <DeclineInvitationClient />
    </Suspense>
  );
}
