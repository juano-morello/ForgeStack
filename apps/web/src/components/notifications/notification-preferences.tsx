'use client';

/**
 * Notification Preferences Component
 *
 * Allows users to configure notification preferences per type.
 */

import { useState, useEffect } from 'react';
import { Loader2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useNotificationPreferences } from '@/hooks/use-notifications';
import { useToast } from '@/hooks/use-toast';
import {
  getNotificationTypesByPriority,
  getPriorityLabel
} from '@/lib/notification-constants';
import type { NotificationPreference } from '@/types/notifications';

interface NotificationPreferencesProps {
  orgId: string;
}

export function NotificationPreferences({ orgId }: NotificationPreferencesProps) {
  const { toast } = useToast();
  const { preferences, isLoading, error, isSaving, updatePreference } = useNotificationPreferences(orgId);
  const [localPreferences, setLocalPreferences] = useState<NotificationPreference[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  const notificationTypes = getNotificationTypesByPriority();

  // Initialize local preferences
  useEffect(() => {
    if (preferences) {
      setLocalPreferences(preferences.preferences);
    }
  }, [preferences]);

  const handleToggle = (type: string, field: 'inAppEnabled' | 'emailEnabled') => {
    setLocalPreferences((prev) => {
      const existing = prev.find((p) => p.type === type);
      
      if (existing) {
        return prev.map((p) =>
          p.type === type ? { ...p, [field]: !p[field] } : p
        );
      } else {
        // Create new preference with defaults
        return [
          ...prev,
          {
            type,
            inAppEnabled: field === 'inAppEnabled' ? false : true,
            emailEnabled: field === 'emailEnabled' ? false : true,
          },
        ];
      }
    });
    setHasChanges(true);
  };

  const getPreference = (type: string): NotificationPreference => {
    return localPreferences.find((p) => p.type === type) || {
      type,
      inAppEnabled: true,
      emailEnabled: true,
    };
  };

  const handleSave = async () => {
    try {
      await updatePreference(localPreferences);
      setHasChanges(false);
      toast({
        title: 'Preferences saved',
        description: 'Your notification preferences have been updated.',
      });
    } catch (err) {
      toast({
        title: 'Failed to save preferences',
        description: err instanceof Error ? err.message : 'An error occurred',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-sm text-destructive">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {(['high', 'medium', 'low'] as const).map((priority) => {
        const types = notificationTypes[priority];
        if (types.length === 0) return null;

        return (
          <Card key={priority}>
            <CardHeader>
              <CardTitle className="text-base">{getPriorityLabel(priority)}</CardTitle>
              <CardDescription>
                {priority === 'high' && 'Critical notifications that require immediate attention'}
                {priority === 'medium' && 'Important notifications about your projects and team'}
                {priority === 'low' && 'General updates and activity notifications'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {types.map((type, index) => {
                const pref = getPreference(type.type);
                
                return (
                  <div key={type.type}>
                    {index > 0 && <Separator className="my-4" />}
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">{type.label}</Label>
                      <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id={`${type.type}-in-app`}
                            checked={pref.inAppEnabled}
                            onCheckedChange={() => handleToggle(type.type, 'inAppEnabled')}
                          />
                          <Label
                            htmlFor={`${type.type}-in-app`}
                            className="text-sm font-normal cursor-pointer"
                          >
                            In-app
                          </Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id={`${type.type}-email`}
                            checked={pref.emailEnabled}
                            onCheckedChange={() => handleToggle(type.type, 'emailEnabled')}
                          />
                          <Label
                            htmlFor={`${type.type}-email`}
                            className="text-sm font-normal cursor-pointer"
                          >
                            Email
                          </Label>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        );
      })}

      {hasChanges && (
        <Button onClick={handleSave} disabled={isSaving} className="w-full">
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save preferences
            </>
          )}
        </Button>
      )}
    </div>
  );
}

