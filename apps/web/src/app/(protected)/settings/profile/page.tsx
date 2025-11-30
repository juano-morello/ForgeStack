'use client';

/**
 * Profile Settings Page
 *
 * Allows users to update their profile information including avatar.
 */

import { useState } from 'react';
import { useSession } from '@/lib/auth-client';
import { useOrgContext } from '@/components/providers/org-provider';
import { ProtectedHeader } from '@/components/layout/protected-header';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AvatarUploader } from '@/components/files/avatar-uploader';
import { useToast } from '@/hooks/use-toast';
import { XCircle } from 'lucide-react';
import type { FileRecord } from '@/types/files';

export default function ProfilePage() {
  const { data: session, isPending } = useSession();
  const { currentOrg } = useOrgContext();
  const { toast } = useToast();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const handleAvatarUpload = (file: FileRecord) => {
    setAvatarUrl(file.url);
    toast({
      title: 'Avatar Updated',
      description: 'Your profile picture has been updated successfully.',
    });
  };

  const userInitials =
    session?.user?.name
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase() || 'U';

  if (isPending) {
    return (
      <div className="min-h-screen bg-background">
        <ProtectedHeader />
        <main className="container mx-auto py-6 px-4 sm:px-6 lg:px-8 max-w-4xl">
          <PageHeader title="Profile Settings" description="Loading..." />
          <div className="space-y-6">
            <Skeleton className="h-64 w-full" />
          </div>
        </main>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="min-h-screen bg-background">
        <ProtectedHeader />
        <main className="container mx-auto py-6 px-4 sm:px-6 lg:px-8 max-w-4xl">
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>Unable to load user session.</AlertDescription>
          </Alert>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <ProtectedHeader />
      <main className="container mx-auto py-6 px-4 sm:px-6 lg:px-8 max-w-4xl">
        <PageHeader
          title="Profile Settings"
          description="Manage your personal profile information"
        />

        <div className="space-y-6">
          {/* Avatar Section */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Picture</CardTitle>
              <CardDescription>
                Upload a profile picture to personalize your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6">
                {currentOrg ? (
                  <AvatarUploader
                    orgId={currentOrg.id}
                    currentUrl={avatarUrl || session.user.image}
                    onUpload={handleAvatarUpload}
                    size="lg"
                    fallback={userInitials}
                  />
                ) : (
                  <Alert>
                    <AlertDescription>
                      Please select an organization to upload an avatar.
                    </AlertDescription>
                  </Alert>
                )}
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">
                    Recommended: Square image, at least 200x200 pixels
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Accepted formats: JPG, PNG, GIF, WebP (max 5MB)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Profile Information */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Your basic profile information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={session.user.name || ''}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  Contact support to change your name
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={session.user.email}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  Contact support to change your email
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

