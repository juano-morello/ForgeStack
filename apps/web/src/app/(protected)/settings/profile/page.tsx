'use client';

/**
 * Profile Settings Page
 *
 * Allows users to update their profile information including avatar.
 */

import { useState } from 'react';
import { useSession } from '@/lib/auth-client';
import { useOrgContext } from '@/components/providers/org-provider';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AvatarUploader } from '@/components/files/avatar-uploader';
import { ChangeEmailDialog } from '@/components/settings/change-email-dialog';
import { ChangePasswordDialog } from '@/components/settings/change-password-dialog';
import { useToast } from '@/hooks/use-toast';
import { XCircle, Loader2, Mail, Lock } from 'lucide-react';
import { userApi } from '@/lib/api';
import type { FileRecord } from '@/types/files';

export default function ProfilePage() {
  const { data: session, isPending } = useSession();
  const { currentOrg } = useOrgContext();
  const { toast } = useToast();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [isNameChanged, setIsNameChanged] = useState(false);
  const [isSavingName, setIsSavingName] = useState(false);
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);

  // Initialize name from session
  useState(() => {
    if (session?.user?.name) {
      setName(session.user.name);
    }
  });

  const handleAvatarUpload = async (file: FileRecord) => {
    try {
      // Update user profile with new avatar URL
      await userApi.updateProfile({ image: file.url });

      setAvatarUrl(file.url);
      toast({
        title: 'Avatar Updated',
        description: 'Your profile picture has been updated successfully.',
      });
    } catch (error) {
      toast({
        title: 'Avatar Update Failed',
        description: error instanceof Error ? error.message : 'Failed to update avatar',
        variant: 'destructive',
      });
    }
  };

  const handleNameChange = (value: string) => {
    setName(value);
    setIsNameChanged(value !== session?.user?.name);
  };

  const handleSaveName = async () => {
    if (!name.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Name cannot be empty',
        variant: 'destructive',
      });
      return;
    }

    if (name.length > 100) {
      toast({
        title: 'Validation Error',
        description: 'Name must be 100 characters or less',
        variant: 'destructive',
      });
      return;
    }

    setIsSavingName(true);

    try {
      await userApi.updateProfile({ name: name.trim() });

      toast({
        title: 'Name Updated',
        description: 'Your name has been updated successfully.',
      });

      setIsNameChanged(false);

      // Refresh session to get updated name
      window.location.reload();
    } catch (error) {
      toast({
        title: 'Name Update Failed',
        description: error instanceof Error ? error.message : 'Failed to update name',
        variant: 'destructive',
      });
    } finally {
      setIsSavingName(false);
    }
  };

  const userInitials =
    session?.user?.name
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase() || 'U';

  // Update name state when session changes
  if (session?.user?.name && name !== session.user.name && !isNameChanged) {
    setName(session.user.name);
  }

  if (isPending) {
    return (
      <>
        <PageHeader title="Profile Settings" description="Loading..." />
        <div className="space-y-6">
          <Skeleton className="h-64 w-full" />
        </div>
      </>
    );
  }

  if (!session?.user) {
    return (
      <Alert variant="destructive">
        <XCircle className="h-4 w-4" />
        <AlertDescription>Unable to load user session.</AlertDescription>
      </Alert>
    );
  }

  return (
    <>
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
                <div className="flex gap-2">
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="Enter your name"
                    disabled={isSavingName}
                  />
                  {isNameChanged && (
                    <Button
                      onClick={handleSaveName}
                      disabled={isSavingName}
                      size="default"
                    >
                      {isSavingName && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                      Save
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Your display name (1-100 characters)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="flex gap-2">
                  <Input
                    id="email"
                    type="email"
                    value={session.user.email}
                    disabled
                    className="bg-muted flex-1"
                  />
                  <Button
                    variant="outline"
                    onClick={() => setIsEmailDialogOpen(true)}
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Change Email
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Your login email address
                </p>
              </div>

              <div className="space-y-2">
                <Label>Password</Label>
                <div className="flex gap-2">
                  <Input
                    type="password"
                    value="••••••••"
                    disabled
                    className="bg-muted flex-1"
                  />
                  <Button
                    variant="outline"
                    onClick={() => setIsPasswordDialogOpen(true)}
                  >
                    <Lock className="h-4 w-4 mr-2" />
                    Change Password
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Update your password for security
                </p>
              </div>
            </CardContent>
          </Card>
      </div>

      {/* Dialogs */}
      <ChangeEmailDialog
        open={isEmailDialogOpen}
        onOpenChange={setIsEmailDialogOpen}
        currentEmail={session.user.email}
      />
      <ChangePasswordDialog
        open={isPasswordDialogOpen}
        onOpenChange={setIsPasswordDialogOpen}
      />
    </>
  );
}

