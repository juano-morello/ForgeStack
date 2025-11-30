'use client';

/**
 * Notification Settings Page
 *
 * Page for managing notification preferences.
 */

import { useEffect, useState } from 'react';
import { NotificationPreferences } from '@/components/notifications/notification-preferences';

export default function NotificationSettingsPage() {
  const [orgId, setOrgId] = useState<string>('');

  useEffect(() => {
    // Get current org ID from localStorage
    const currentOrgId = localStorage.getItem('currentOrgId');
    if (currentOrgId) {
      setOrgId(currentOrgId);
    }
  }, []);

  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Notification Preferences</h1>
        <p className="text-muted-foreground mt-2">
          Manage how you receive notifications for different types of events.
        </p>
      </div>

      {orgId ? (
        <NotificationPreferences orgId={orgId} />
      ) : (
        <div className="p-8 text-center">
          <p className="text-muted-foreground">Please select an organization</p>
        </div>
      )}
    </div>
  );
}

