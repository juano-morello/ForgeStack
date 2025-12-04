import { cn } from '@/lib/utils';
import { AlertCircle, Info, AlertTriangle, CheckCircle } from 'lucide-react';

interface CalloutProps {
  type?: 'info' | 'warning' | 'error' | 'success';
  title?: string;
  children: React.ReactNode;
}

const icons = {
  info: Info,
  warning: AlertTriangle,
  error: AlertCircle,
  success: CheckCircle,
};

const styles = {
  info: 'bg-blue-500/10 border-blue-500/50 text-blue-500',
  warning: 'bg-yellow-500/10 border-yellow-500/50 text-yellow-500',
  error: 'bg-red-500/10 border-red-500/50 text-red-500',
  success: 'bg-green-500/10 border-green-500/50 text-green-500',
};

export function Callout({ type = 'info', title, children }: CalloutProps) {
  const Icon = icons[type];

  return (
    <div className={cn('border rounded-lg p-4 my-4', styles[type])}>
      <div className="flex items-start gap-3">
        <Icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
        <div>
          {title && <p className="font-semibold mb-1">{title}</p>}
          <div className="text-sm text-foreground">{children}</div>
        </div>
      </div>
    </div>
  );
}

