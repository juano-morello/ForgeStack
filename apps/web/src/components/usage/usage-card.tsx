'use client';

/**
 * Usage Card Component
 *
 * Displays a single usage metric with progress bar and limit information.
 */

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import type { UsageMetric } from '@/types/usage';

interface UsageCardProps {
  metric: UsageMetric;
  title: string;
  icon?: React.ReactNode;
  formatValue?: (value: number) => string;
}

export function UsageCard({ metric, title, icon, formatValue }: UsageCardProps) {
  const formattedCurrent = formatValue ? formatValue(metric.current) : metric.current.toLocaleString();
  const formattedLimit = metric.limit !== null 
    ? (formatValue ? formatValue(metric.limit) : metric.limit.toLocaleString())
    : 'Unlimited';

  const getStatusColor = (percentage: number) => {
    if (percentage >= 90) return 'destructive';
    if (percentage >= 75) return 'warning';
    return 'default';
  };

  const statusColor = getStatusColor(metric.percentage);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-bold">{formattedCurrent}</div>
            <div className="text-sm text-muted-foreground">
              of {formattedLimit}
            </div>
          </div>
          
          {metric.limit !== null && (
            <>
              <Progress value={metric.percentage} className="h-2" />
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  {metric.percentage.toFixed(1)}% used
                </span>
                {metric.percentage >= 75 && (
                  <Badge variant={statusColor} className="text-xs">
                    {metric.percentage >= 90 ? 'Critical' : 'Warning'}
                  </Badge>
                )}
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

