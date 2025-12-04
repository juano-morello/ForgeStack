/**
 * Welcome Step Component
 *
 * First step of the onboarding wizard with a personalized greeting.
 */

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, Check } from 'lucide-react';

interface WelcomeStepProps {
  userName: string;
  onNext: () => void;
}

export function WelcomeStep({ userName, onNext }: WelcomeStepProps) {
  return (
    <Card className="text-center">
      <CardHeader>
        <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
          <Sparkles className="h-8 w-8 text-primary" />
        </div>
        <CardTitle className="text-2xl">Welcome to ForgeStack, {userName}!</CardTitle>
        <CardDescription>Let's get you set up in just a few steps.</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="text-left space-y-2 mb-6">
          <li className="flex items-center gap-2">
            <Check className="h-4 w-4 text-green-500" />
            <span>Create your organization</span>
          </li>
          <li className="flex items-center gap-2">
            <Check className="h-4 w-4 text-green-500" />
            <span>Invite your team</span>
          </li>
          <li className="flex items-center gap-2">
            <Check className="h-4 w-4 text-green-500" />
            <span>Choose your plan</span>
          </li>
        </ul>
      </CardContent>
      <CardFooter>
        <Button onClick={onNext} className="w-full">Let's Get Started</Button>
      </CardFooter>
    </Card>
  );
}

