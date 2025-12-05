'use client';

/**
 * Organization Settings Page
 *
 * Allows organization owners to manage organization settings including logo.
 */

import { useState } from 'react';
import { useOrgContext } from '@/components/providers/org-provider';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileUploader } from '@/components/files/file-uploader';
import { useToast } from '@/hooks/use-toast';
import { XCircle, Building2, Loader2 } from 'lucide-react';
import { organizationApi } from '@/lib/api';
import { TIMEZONES, LANGUAGES } from '@/lib/org-constants';
import type { FileRecord } from '@/types/files';

export default function OrganizationSettingsPage() {
  const { currentOrg, isLoading } = useOrgContext();
  const { toast } = useToast();
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [orgName, setOrgName] = useState('');
  const [timezone, setTimezone] = useState<string>('UTC');
  const [language, setLanguage] = useState<string>('en-US');
  const [isNameChanged, setIsNameChanged] = useState(false);
  const [isPreferencesChanged, setIsPreferencesChanged] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Initialize form values from currentOrg
  useState(() => {
    if (currentOrg) {
      setOrgName(currentOrg.name);
      // @ts-expect-error - timezone and language may not be in the type yet
      setTimezone(currentOrg.timezone || 'UTC');
      // @ts-expect-error - timezone and language may not be in the type yet
      setLanguage(currentOrg.language || 'en-US');
    }
  });

  const handleLogoUpload = async (file: FileRecord) => {
    if (!currentOrg) return;

    try {
      // Update organization with new logo URL
      await organizationApi.update(currentOrg.id, { logo: file.url });

      setLogoUrl(file.url);
      toast({
        title: 'Logo Updated',
        description: 'Your organization logo has been updated successfully.',
      });

      // Refresh page to update org context
      window.location.reload();
    } catch (error) {
      toast({
        title: 'Logo Update Failed',
        description: error instanceof Error ? error.message : 'Failed to update logo',
        variant: 'destructive',
      });
    }
  };

  const handleLogoError = (error: string) => {
    toast({
      title: 'Upload Failed',
      description: error,
      variant: 'destructive',
    });
  };

  const handleNameChange = (value: string) => {
    setOrgName(value);
    setIsNameChanged(value !== currentOrg?.name);
  };

  const handleTimezoneChange = (value: string) => {
    setTimezone(value);
    // @ts-expect-error - timezone may not be in the type yet
    setIsPreferencesChanged(value !== (currentOrg?.timezone || 'UTC') || language !== (currentOrg?.language || 'en-US'));
  };

  const handleLanguageChange = (value: string) => {
    setLanguage(value);
    // @ts-expect-error - language may not be in the type yet
    setIsPreferencesChanged(timezone !== (currentOrg?.timezone || 'UTC') || value !== (currentOrg?.language || 'en-US'));
  };

  const handleSaveName = async () => {
    if (!currentOrg) return;

    if (!orgName.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Organization name cannot be empty',
        variant: 'destructive',
      });
      return;
    }

    if (orgName.length < 2 || orgName.length > 100) {
      toast({
        title: 'Validation Error',
        description: 'Organization name must be between 2 and 100 characters',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);

    try {
      await organizationApi.update(currentOrg.id, { name: orgName.trim() });

      toast({
        title: 'Organization Name Updated',
        description: 'Your organization name has been updated successfully.',
      });

      setIsNameChanged(false);

      // Refresh page to update org context
      window.location.reload();
    } catch (error) {
      toast({
        title: 'Update Failed',
        description: error instanceof Error ? error.message : 'Failed to update organization name',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePreferences = async () => {
    if (!currentOrg) return;

    setIsSaving(true);

    try {
      await organizationApi.update(currentOrg.id, { timezone, language });

      toast({
        title: 'Preferences Updated',
        description: 'Your organization preferences have been updated successfully.',
      });

      setIsPreferencesChanged(false);

      // Refresh page to update org context
      window.location.reload();
    } catch (error) {
      toast({
        title: 'Update Failed',
        description: error instanceof Error ? error.message : 'Failed to update preferences',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <>
        <PageHeader title="Organization Settings" description="Loading..." />
        <div className="space-y-6">
          <Skeleton className="h-64 w-full" />
        </div>
      </>
    );
  }

  if (!currentOrg) {
    return (
      <Alert variant="destructive">
        <XCircle className="h-4 w-4" />
        <AlertDescription>
          Please select an organization to view settings.
        </AlertDescription>
      </Alert>
    );
  }

  const isOwner = currentOrg.role === 'OWNER';

  // Update form values when currentOrg changes
  if (currentOrg && orgName !== currentOrg.name && !isNameChanged) {
    setOrgName(currentOrg.name);
    // @ts-expect-error - timezone and language may not be in the type yet
    setTimezone(currentOrg.timezone || 'UTC');
    // @ts-expect-error - timezone and language may not be in the type yet
    setLanguage(currentOrg.language || 'en-US');
  }

  return (
    <>
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
                <div className="flex gap-2">
                  <Input
                    id="org-name"
                    value={orgName}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="Enter organization name"
                    disabled={!isOwner || isSaving}
                    className={!isOwner ? 'bg-muted' : ''}
                  />
                  {isOwner && isNameChanged && (
                    <Button
                      onClick={handleSaveName}
                      disabled={isSaving}
                      size="default"
                    >
                      {isSaving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                      Save
                    </Button>
                  )}
                </div>
                {isOwner ? (
                  <p className="text-xs text-muted-foreground">
                    Organization display name (2-100 characters)
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

          {/* Organization Preferences */}
          {isOwner && (
            <Card>
              <CardHeader>
                <CardTitle>Organization Preferences</CardTitle>
                <CardDescription>
                  Set timezone and language preferences for your organization
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select
                    value={timezone}
                    onValueChange={handleTimezoneChange}
                    disabled={isSaving}
                  >
                    <SelectTrigger id="timezone">
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIMEZONES.map((tz) => (
                        <SelectItem key={tz.value} value={tz.value}>
                          {tz.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Used for date and time formatting across the organization
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  <Select
                    value={language}
                    onValueChange={handleLanguageChange}
                    disabled={isSaving}
                  >
                    <SelectTrigger id="language">
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGES.map((lang) => (
                        <SelectItem key={lang.value} value={lang.value}>
                          {lang.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Preferred language for the organization
                  </p>
                </div>

                {isPreferencesChanged && (
                  <div className="flex justify-end">
                    <Button
                      onClick={handleSavePreferences}
                      disabled={isSaving}
                    >
                      {isSaving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                      Save Preferences
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
      </div>
    </>
  );
}

