'use client';

/**
 * Organization Settings Page
 *
 * Allows organization owners to manage organization settings including logo.
 */

import { useState } from 'react';
import { useOrgContext } from '@/components/providers/org-provider';
import { ProtectedHeader } from '@/components/layout/protected-header';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileUploader } from '@/components/files/file-uploader';
import { useToast } from '@/hooks/use-toast';
import { XCircle, Building2 } from 'lucide-react';
import type { FileRecord } from '@/types/files';

export default function OrganizationSettingsPage() {
  const { currentOrg, isLoading } = useOrgContext();
  const { toast } = useToast();
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  const handleLogoUpload = (file: FileRecord) => {
    setLogoUrl(file.url);
    toast({
      title: 'Logo Updated',
      description: 'Your organization logo has been updated successfully.',
    });
  };

  const handleLogoError = (error: string) => {
    toast({
      title: 'Upload Failed',
      description: error,
      variant: 'destructive',
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <ProtectedHeader />
        <main className="container mx-auto py-6 px-4 sm:px-6 lg:px-8 max-w-4xl">
          <PageHeader title="Organization Settings" description="Loading..." />
          <div className="space-y-6">
            <Skeleton className="h-64 w-full" />
          </div>
        </main>
      </div>
    );
  }

  if (!currentOrg) {
    return (
      <div className="min-h-screen bg-background">
        <ProtectedHeader />
        <main className="container mx-auto py-6 px-4 sm:px-6 lg:px-8 max-w-4xl">
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              Please select an organization to view settings.
            </AlertDescription>
          </Alert>
        </main>
      </div>
    );
  }

  const isOwner = currentOrg.role === 'OWNER';

  return (
    <div className="min-h-screen bg-background">
      <ProtectedHeader />
      <main className="container mx-auto py-6 px-4 sm:px-6 lg:px-8 max-w-4xl">
        <PageHeader
          title="Organization Settings"
          description={`Manage settings for ${currentOrg.name}`}
        />

        <div className="space-y-6">
          {/* Logo Section */}
          <Card>
            <CardHeader>
              <CardTitle>Organization Logo</CardTitle>
              <CardDescription>
                Upload a logo to represent your organization
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isOwner ? (
                <div className="space-y-4">
                  {logoUrl && (
                    <div className="flex items-center gap-4 p-4 border rounded-lg">
                      <Building2 className="h-12 w-12 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Current Logo</p>
                        <p className="text-xs text-muted-foreground">
                          Logo uploaded successfully
                        </p>
                      </div>
                    </div>
                  )}
                  <FileUploader
                    orgId={currentOrg.id}
                    purpose="logo"
                    onUpload={handleLogoUpload}
                    onError={handleLogoError}
                  />
                  <p className="text-sm text-muted-foreground">
                    Recommended: Square or rectangular image, at least 400x400 pixels
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Accepted formats: JPG, PNG, GIF, WebP, SVG (max 5MB)
                  </p>
                </div>
              ) : (
                <Alert>
                  <AlertDescription>
                    Only organization owners can upload a logo.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Organization Information */}
          <Card>
            <CardHeader>
              <CardTitle>Organization Information</CardTitle>
              <CardDescription>
                Basic information about your organization
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="org-name">Organization Name</Label>
                <Input
                  id="org-name"
                  value={currentOrg.name}
                  disabled
                  className="bg-muted"
                />
                {isOwner ? (
                  <p className="text-xs text-muted-foreground">
                    Contact support to change your organization name
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Only owners can modify organization settings
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="org-role">Your Role</Label>
                <Input
                  id="org-role"
                  value={currentOrg.role || 'MEMBER'}
                  disabled
                  className="bg-muted"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

