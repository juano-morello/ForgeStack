'use client';

/**
 * Usage Limit Alert Component
 *
 * Displays alerts when approaching or exceeding usage limits.
 */

import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, XCircle } from 'lucide-react';
import type { UsageSummary } from '@/types/usage';

interface UsageLimitAlertProps {
  summary: UsageSummary;
}

export function UsageLimitAlert({ summary }: UsageLimitAlertProps) {
  const metrics = [
    { name: 'API Calls', metric: summary.apiCalls },
    { name: 'Storage', metric: summary.storage },
    { name: 'Active Seats', metric: summary.seats },
  ];

  const criticalMetrics = metrics.filter(m => m.metric.limit !== null && m.metric.percentage >= 90);
  const warningMetrics = metrics.filter(m => m.metric.limit !== null && m.metric.percentage >= 75 && m.metric.percentage < 90);

  if (criticalMetrics.length === 0 && warningMetrics.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      {criticalMetrics.map((item) => (
        <Alert key={item.name} variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>{item.name}</strong> usage is at {item.metric.percentage.toFixed(1)}% of your limit. 
            You may experience service interruptions if you exceed your limit.
          </AlertDescription>
        </Alert>
      ))}
      
      {warningMetrics.map((item) => (
        <Alert key={item.name} variant="default" className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
          <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
          <AlertDescription className="text-yellow-800 dark:text-yellow-200">
            <strong>{item.name}</strong> usage is at {item.metric.percentage.toFixed(1)}% of your limit. 
            Consider upgrading your plan to avoid interruptions.
          </AlertDescription>
        </Alert>
      ))}
    </div>
  );
}

