'use client';

/**
 * Action Badge Component
 *
 * Displays an action badge with appropriate icon and color.
 * Uses shadcn/ui Badge component with custom styling.
 */

import { Badge } from '@/components/ui/badge';
import { 
  Plus, Edit, Trash, UserPlus, UserCheck, UserMinus, Shield,
  LogIn, LogOut, AlertCircle, Key, ShieldCheck, ShieldOff,
  Upload, XCircle, RotateCw, CreditCard, Activity
} from 'lucide-react';
import { getActionLabel, getActionVariant, getActionIcon } from '@/lib/audit-log-constants';
import { cn } from '@/lib/utils';

interface ActionBadgeProps {
  action: string;
  className?: string;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  'plus': Plus,
  'edit': Edit,
  'trash': Trash,
  'user-plus': UserPlus,
  'user-check': UserCheck,
  'user-minus': UserMinus,
  'shield': Shield,
  'log-in': LogIn,
  'log-out': LogOut,
  'alert-circle': AlertCircle,
  'key': Key,
  'shield-check': ShieldCheck,
  'shield-off': ShieldOff,
  'upload': Upload,
  'x-circle': XCircle,
  'rotate-cw': RotateCw,
  'credit-card': CreditCard,
  'activity': Activity,
};

export function ActionBadge({ action, className }: ActionBadgeProps) {
  const label = getActionLabel(action);
  const variant = getActionVariant(action);
  const iconName = getActionIcon(action);
  const Icon = iconMap[iconName] || Activity;

  return (
    <Badge
      variant={variant}
      className={cn('flex items-center gap-1.5 font-medium', className)}
    >
      <Icon className="h-3 w-3" />
      <span>{label}</span>
    </Badge>
  );
}

