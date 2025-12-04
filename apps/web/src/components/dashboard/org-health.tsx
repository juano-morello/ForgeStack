/**
 * Organization Health Component
 *
 * Displays organization health metrics for owners.
 */

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import type { OrgHealth } from '@/types/dashboard';

interface OrgHealthProps {
  health: OrgHealth;
}

export function OrgHealth({ health }: OrgHealthProps) {
  const { subscriptionStatus, usageSummary } = health;

  const getStatusVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'default';
      case 'trialing':
        return 'secondary';
      case 'past_due':
      case 'unpaid':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Organization Health</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Subscription Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Subscription</span>
          <Badge variant={getStatusVariant(subscriptionStatus)}>
            {subscriptionStatus}
          </Badge>
        </div>

        {/* API Calls Usage */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">API Calls</span>
            <span className="text-muted-foreground">
              {usageSummary.apiCalls.current.toLocaleString()}
              {usageSummary.apiCalls.limit && ` / ${usageSummary.apiCalls.limit.toLocaleString()}`}
            </span>
          </div>
          <Progress value={usageSummary.apiCalls.percentage} />
        </div>

        {/* Storage Usage */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Storage</span>
            <span className="text-muted-foreground">
              {(usageSummary.storage.current / (1024 * 1024 * 1024)).toFixed(2)} GB
              {usageSummary.storage.limit && 
                ` / ${(usageSummary.storage.limit / (1024 * 1024 * 1024)).toFixed(2)} GB`}
            </span>
          </div>
          <Progress value={usageSummary.storage.percentage} />
        </div>
      </CardContent>
    </Card>
  );
}

