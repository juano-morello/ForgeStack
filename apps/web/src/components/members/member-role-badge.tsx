'use client';

/**
 * Member Role Badge Component
 *
 * Displays a badge for member roles (OWNER/MEMBER).
 * Uses shadcn/ui Badge component with custom styling.
 */

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface MemberRoleBadgeProps {
  role: 'OWNER' | 'MEMBER';
  className?: string;
}

export function MemberRoleBadge({ role, className }: MemberRoleBadgeProps) {
  return (
    <Badge
      variant={role === 'OWNER' ? 'destructive' : 'secondary'}
      className={cn(
        'font-semibold',
        role === 'OWNER' && 'bg-red-600 hover:bg-red-700 text-white',
        className
      )}
    >
      {role}
    </Badge>
  );
}

