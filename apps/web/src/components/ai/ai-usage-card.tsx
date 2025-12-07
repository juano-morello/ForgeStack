'use client';

/**
 * AI Usage Card Component
 *
 * Displays AI usage statistics including tokens used and request count.
 */

import { useEffect, useState } from 'react';
import { Activity, Zap } from 'lucide-react';
import { aiApi, type AiUsageResponse } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';

interface AiUsageCardProps {
  period?: 'day' | 'week' | 'month';
}

export function AiUsageCard({ period = 'month' }: AiUsageCardProps) {
  const [usage, setUsage] = useState<AiUsageResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsage = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const data = await aiApi.getUsage(period);
        setUsage(data);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to fetch usage';
        setError(message);
        console.error('Error fetching AI usage:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsage();
  }, [period]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>AI Usage</CardTitle>
          <CardDescription>Loading usage statistics...</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>AI Usage</CardTitle>
          <CardDescription className="text-destructive">{error}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!usage) {
    return null;
  }

  const usagePercentage = usage.limit.tokensPerDay > 0
    ? Math.min((usage.usage.totalTokens / usage.limit.tokensPerDay) * 100, 100)
    : 0;

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          AI Usage
        </CardTitle>
        <CardDescription>
          Usage for this {period}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Token Usage */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Tokens Used</span>
            <span className="font-medium">
              {formatNumber(usage.usage.totalTokens)} / {formatNumber(usage.limit.tokensPerDay)}
            </span>
          </div>
          <Progress value={usagePercentage} className="h-2" />
          <p className="text-xs text-muted-foreground">
            {formatNumber(usage.limit.remaining)} tokens remaining
          </p>
        </div>

        {/* Request Count */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Activity className="h-4 w-4" />
            <span>Requests</span>
          </div>
          <span className="font-medium">{usage.usage.requestCount}</span>
        </div>

        {/* Provider Breakdown */}
        {Object.keys(usage.byProvider).length > 0 && (
          <div className="pt-2 border-t space-y-2">
            <p className="text-sm font-medium">By Provider</p>
            {Object.entries(usage.byProvider).map(([provider, stats]) => (
              <div key={provider} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground capitalize">{provider}</span>
                <span className="font-mono text-xs">
                  {formatNumber(stats.tokens)} tokens ({stats.requests} req)
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

