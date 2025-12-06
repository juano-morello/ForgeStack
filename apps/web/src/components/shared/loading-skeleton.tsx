/**
 * Loading Skeleton Components
 *
 * Various skeleton loading states for different content types.
 */

import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
}

/**
 * Card skeleton for loading card content
 */
export function CardSkeleton({ className }: SkeletonProps) {
  return (
    <Card className={cn('overflow-hidden', className)} data-testid="card-skeleton">
      <CardHeader className="gap-2">
        <Skeleton className="h-5 w-1/2" />
        <Skeleton className="h-4 w-4/5" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="mt-2 h-4 w-3/4" />
      </CardContent>
    </Card>
  );
}

/**
 * Table row skeleton for loading table content
 */
export function TableRowSkeleton({
  columns = 4,
  className,
}: SkeletonProps & { columns?: number }) {
  return (
    <div className={cn('flex items-center gap-4 p-4', className)}>
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn('h-4', i === 0 ? 'w-1/4' : 'flex-1')}
        />
      ))}
    </div>
  );
}

/**
 * List item skeleton for loading list content
 */
export function ListItemSkeleton({ className }: SkeletonProps) {
  return (
    <div className={cn('flex items-center gap-4 p-4', className)}>
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  );
}

/**
 * Stats card skeleton for loading stats
 */
export function StatsSkeleton({ className }: SkeletonProps) {
  return (
    <Card className={cn('p-6', className)}>
      <div className="flex items-center gap-4">
        <Skeleton className="h-12 w-12 rounded-lg" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-6 w-1/3" />
        </div>
      </div>
    </Card>
  );
}

/**
 * Page header skeleton
 */
export function PageHeaderSkeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-4 pb-6 md:flex-row md:items-center md:justify-between',
        className
      )}
    >
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
      <Skeleton className="h-10 w-32" />
    </div>
  );
}

