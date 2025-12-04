/**
 * Create Organization Step Component
 *
 * Step for creating an organization during onboarding.
 */

'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';
import { Loader2 } from 'lucide-react';

interface CreateOrgStepProps {
  onNext: (orgId: string, orgName: string) => void;
  onBack: () => void;
  onSkip: () => void;
}

export function CreateOrgStep({ onNext, onBack, onSkip }: CreateOrgStepProps) {
  const [orgName, setOrgName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!orgName.trim()) {
      setError('Organization name is required');
      return;
    }

    setIsCreating(true);

    try {
      const response = await api.post<{ id: string; name: string }>('/organizations', { name: orgName });
      onNext(response.id, response.name);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create organization');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Your Organization</CardTitle>
        <CardDescription>This is where your team will collaborate.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} id="create-org-form">
          <div className="space-y-4">
            <div>
              <Label htmlFor="orgName">Organization Name</Label>
              <Input
                id="orgName"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                placeholder="Acme Inc."
                disabled={isCreating}
                className="mt-1"
              />
              {error && <p className="text-sm text-destructive mt-1">{error}</p>}
            </div>
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="ghost" onClick={onBack} disabled={isCreating}>
          Back
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onSkip} disabled={isCreating}>
            Skip
          </Button>
          <Button 
            type="submit" 
            form="create-org-form" 
            disabled={!orgName.trim() || isCreating}
          >
            {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isCreating ? 'Creating...' : 'Create Organization'}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}

