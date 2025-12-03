/**
 * Invite Team Step Component
 *
 * Step for inviting team members during onboarding.
 */

'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, X, Loader2 } from 'lucide-react';

interface InviteTeamStepProps {
  onNext: (emails: string[]) => void;
  onBack: () => void;
  onSkip: () => void;
}

export function InviteTeamStep({ onNext, onBack, onSkip }: InviteTeamStepProps) {
  const [emails, setEmails] = useState<string[]>(['']);
  const [isInviting, setIsInviting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addEmailField = () => {
    setEmails([...emails, '']);
  };

  const removeEmailField = (index: number) => {
    setEmails(emails.filter((_, i) => i !== index));
  };

  const updateEmail = (index: number, value: string) => {
    const newEmails = [...emails];
    newEmails[index] = value;
    setEmails(newEmails);
  };

  const validateEmails = () => {
    const validEmails = emails.filter(email => email.trim() !== '');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    for (const email of validEmails) {
      if (!emailRegex.test(email)) {
        setError(`Invalid email: ${email}`);
        return false;
      }
    }
    
    return true;
  };

  const handleSubmit = async () => {
    setError(null);

    if (!validateEmails()) {
      return;
    }

    const validEmails = emails.filter(email => email.trim() !== '');
    
    if (validEmails.length === 0) {
      onSkip();
      return;
    }

    setIsInviting(true);

    try {
      // Note: Invitations API would be called here
      // For now, just proceed to next step
      onNext(validEmails);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send invitations');
    } finally {
      setIsInviting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Invite Your Team</CardTitle>
        <CardDescription>Collaborate with your teammates.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {emails.map((email, index) => (
            <div key={index} className="flex gap-2">
              <Input
                type="email"
                value={email}
                onChange={(e) => updateEmail(index, e.target.value)}
                placeholder="teammate@example.com"
                disabled={isInviting}
              />
              {emails.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeEmailField(index)}
                  disabled={isInviting}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button
            variant="outline"
            size="sm"
            onClick={addEmailField}
            disabled={isInviting}
            className="mt-2"
          >
            <Plus className="h-4 w-4 mr-2" /> Add Another
          </Button>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="ghost" onClick={onBack} disabled={isInviting}>
          Back
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onSkip} disabled={isInviting}>
            Skip for Now
          </Button>
          <Button onClick={handleSubmit} disabled={isInviting}>
            {isInviting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isInviting ? 'Sending...' : 'Send Invites'}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}

