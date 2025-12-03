/**
 * Complete Step Component
 *
 * Final step of the onboarding wizard showing success message.
 */

import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, FolderPlus, Key } from 'lucide-react';

interface CompleteStepProps {
  onComplete: () => void;
}

export function CompleteStep({ onComplete }: CompleteStepProps) {
  return (
    <Card className="text-center">
      <CardHeader>
        <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <CardTitle className="text-2xl">You're All Set!</CardTitle>
        <CardDescription>Your workspace is ready to go.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Link
            href="/projects/new"
            className="p-4 border rounded-lg hover:bg-muted transition-colors"
          >
            <FolderPlus className="h-6 w-6 mb-2 mx-auto" />
            <span className="text-sm">Create Project</span>
          </Link>
          <Link
            href="/settings/api-keys"
            className="p-4 border rounded-lg hover:bg-muted transition-colors"
          >
            <Key className="h-6 w-6 mb-2 mx-auto" />
            <span className="text-sm">API Keys</span>
          </Link>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={onComplete} className="w-full">
          Go to Dashboard
        </Button>
      </CardFooter>
    </Card>
  );
}

