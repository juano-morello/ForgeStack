'use client';

/**
 * Changes Diff Component
 *
 * Displays before/after comparison of changes in audit logs.
 * Shows changed fields with highlighting.
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ChangesDiffProps {
  changes: {
    before?: Record<string, unknown>;
    after?: Record<string, unknown>;
  } | null;
}

export function ChangesDiff({ changes }: ChangesDiffProps) {
  if (!changes || (!changes.before && !changes.after)) {
    return (
      <div className="text-sm text-muted-foreground">
        No changes recorded
      </div>
    );
  }

  const beforeData = changes.before || {};
  const afterData = changes.after || {};
  
  // Get all unique keys from both before and after
  const allKeys = new Set([
    ...Object.keys(beforeData),
    ...Object.keys(afterData),
  ]);

  const changedFields = Array.from(allKeys).filter(key => {
    const beforeValue = beforeData[key];
    const afterValue = afterData[key];
    return JSON.stringify(beforeValue) !== JSON.stringify(afterValue);
  });

  if (changedFields.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        No changes detected
      </div>
    );
  }

  const formatValue = (value: unknown): string => {
    if (value === null || value === undefined) {
      return '(empty)';
    }
    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  };

  return (
    <div className="space-y-4">
      {changedFields.map((field) => {
        const beforeValue = beforeData[field];
        const afterValue = afterData[field];
        const hasBeforeValue = field in beforeData;
        const hasAfterValue = field in afterData;

        return (
          <Card key={field}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <span className="font-mono">{field}</span>
                {!hasBeforeValue && (
                  <Badge variant="default" className="text-xs">Added</Badge>
                )}
                {!hasAfterValue && (
                  <Badge variant="destructive" className="text-xs">Removed</Badge>
                )}
                {hasBeforeValue && hasAfterValue && (
                  <Badge variant="secondary" className="text-xs">Changed</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {hasBeforeValue && (
                <div>
                  <div className="text-xs font-medium text-muted-foreground mb-1">
                    Before:
                  </div>
                  <div className="rounded-md bg-destructive/10 p-2 text-sm font-mono">
                    {formatValue(beforeValue)}
                  </div>
                </div>
              )}
              {hasAfterValue && (
                <div>
                  <div className="text-xs font-medium text-muted-foreground mb-1">
                    After:
                  </div>
                  <div className="rounded-md bg-primary/10 p-2 text-sm font-mono">
                    {formatValue(afterValue)}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

