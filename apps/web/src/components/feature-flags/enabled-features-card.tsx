'use client';

/**
 * Enabled Features Card Component
 *
 * Displays enabled features for the current organization.
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Check, X, Lock } from 'lucide-react';
import type { FeatureStatus } from '@/types/feature-flags';

interface EnabledFeaturesCardProps {
  features: FeatureStatus[];
  isLoading: boolean;
  error?: string | null;
}

export function EnabledFeaturesCard({ features, isLoading, error }: EnabledFeaturesCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Features</CardTitle>
          <CardDescription>Features available for your organization</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Features</CardTitle>
          <CardDescription>Features available for your organization</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Features</CardTitle>
        <CardDescription>Features available for your organization</CardDescription>
      </CardHeader>
      <CardContent>
        {features.length === 0 ? (
          <p className="text-sm text-muted-foreground">No features configured</p>
        ) : (
          <div className="space-y-3">
            {features.map((feature) => (
              <div
                key={feature.key}
                className="flex items-start justify-between gap-4 rounded-lg border p-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-sm">{feature.name}</h4>
                  </div>
                  {feature.description && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {feature.description}
                    </p>
                  )}
                </div>
                <div className="flex-shrink-0">
                  {feature.enabled ? (
                    <Badge variant="default" className="gap-1">
                      <Check className="h-3 w-3" />
                      Enabled
                    </Badge>
                  ) : feature.requiredPlan ? (
                    <Badge variant="secondary" className="gap-1">
                      <Lock className="h-3 w-3" />
                      {feature.requiredPlan}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="gap-1">
                      <X className="h-3 w-3" />
                      Disabled
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

