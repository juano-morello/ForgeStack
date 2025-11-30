'use client';

/**
 * Scope Badge Component
 *
 * Displays an API key scope as a badge with color coding and tooltip.
 */

import { Badge } from '@/components/ui/badge';
import { SCOPE_LABELS, SCOPE_DESCRIPTIONS, getScopeVariant } from '@/lib/api-key-constants';
import type { ApiKeyScope } from '@/types/api-keys';

interface ScopeBadgeProps {
  scope: ApiKeyScope;
  showTooltip?: boolean;
}

export function ScopeBadge({ scope, showTooltip = true }: ScopeBadgeProps) {
  const label = SCOPE_LABELS[scope] || scope;
  const description = SCOPE_DESCRIPTIONS[scope];
  const variant = getScopeVariant(scope);

  const badge = (
    <Badge variant={variant} className="text-xs">
      {label}
    </Badge>
  );

  if (showTooltip && description) {
    return (
      <span title={description} className="cursor-help">
        {badge}
      </span>
    );
  }

  return badge;
}

