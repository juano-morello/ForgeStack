/**
 * Stats Card Component
 *
 * Displays a statistic with an icon, title, and optional trend indicator.
 */

import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  icon: LucideIcon;
  title: string;
  value: string | number;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export function StatsCard({
  icon: Icon,
  title,
  value,
  trend,
  className,
}: StatsCardProps) {
  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
            <Icon className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold">{value}</p>
              {trend && (
                <span
                  className={cn(
                    'flex items-center text-xs font-medium',
                    trend.isPositive ? 'text-emerald-500' : 'text-red-500'
                  )}
                >
                  {trend.isPositive ? (
                    <TrendingUp className="mr-0.5 h-3 w-3" />
                  ) : (
                    <TrendingDown className="mr-0.5 h-3 w-3" />
                  )}
                  {Math.abs(trend.value)}%
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

