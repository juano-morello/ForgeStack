'use client';

/**
 * New Organization Page
 *
 * Page for creating a new organization.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useOrgContext } from '@/components/providers/org-provider';
import { ApiError } from '@/lib/api';
import { ArrowLeft } from 'lucide-react';

export default function NewOrganizationPage() {
  const router = useRouter();
  const { createOrganization } = useOrgContext();
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Organization name is required');
      return;
    }
    if (trimmedName.length < 2) {
      setError('Organization name must be at least 2 characters');
      return;
    }
    if (trimmedName.length > 100) {
      setError('Organization name must be 100 characters or less');
      return;
    }

    setIsLoading(true);

    try {
      await createOrganization({ name: trimmedName });
      setName('');
      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to create organization';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Create Organization"
        description="Create a new organization to manage your projects and team"
        actions={
          <Button variant="ghost" size="sm" asChild>
            <Link href="/organizations">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Organization Details</CardTitle>
          <CardDescription>
            Enter the details for your new organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="org-name">Organization Name</Label>
              <Input
                id="org-name"
                placeholder="My Organization"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
                maxLength={100}
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                This will be the name of your organization. You can change it later.
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/organizations')}
                disabled={isLoading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading ? 'Creating...' : 'Create Organization'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </>
  );
}

