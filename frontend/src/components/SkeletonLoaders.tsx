import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface SkeletonCardProps {
  className?: string;
}

export const SkeletonCard = ({ className }: SkeletonCardProps) => (
  <div className={cn('rounded-lg border bg-card p-4 space-y-3', className)}>
    <div className="flex items-center justify-between">
      <div className="h-5 w-16 skeleton rounded" />
      <div className="h-4 w-12 skeleton rounded" />
    </div>
    <div className="h-5 w-3/4 skeleton rounded" />
    <div className="space-y-2">
      <div className="h-4 w-full skeleton rounded" />
      <div className="h-4 w-2/3 skeleton rounded" />
    </div>
    <div className="flex items-center justify-between pt-2">
      <div className="flex items-center gap-2">
        <div className="h-6 w-6 skeleton rounded-full" />
        <div className="h-4 w-16 skeleton rounded" />
      </div>
      <div className="h-4 w-20 skeleton rounded" />
    </div>
  </div>
);

export const SkeletonKanbanColumn = () => (
  <div className="flex flex-col rounded-xl border bg-muted/50 p-3 min-h-[500px]">
    <div className="mb-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="h-5 w-24 skeleton rounded" />
        <div className="h-5 w-5 skeleton rounded-full" />
      </div>
      <div className="h-6 w-6 skeleton rounded" />
    </div>
    <div className="space-y-3">
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
    </div>
  </div>
);

export const SkeletonProjectCard = () => (
  <div className="rounded-xl border bg-card p-6 space-y-4">
    <div className="flex items-start justify-between">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 skeleton rounded-lg" />
        <div className="space-y-2">
          <div className="h-5 w-32 skeleton rounded" />
          <div className="h-4 w-24 skeleton rounded" />
        </div>
      </div>
      <div className="h-6 w-16 skeleton rounded-full" />
    </div>
    <div className="h-4 w-full skeleton rounded" />
    <div className="flex items-center justify-between">
      <div className="flex -space-x-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-8 w-8 skeleton rounded-full border-2 border-card" />
        ))}
      </div>
      <div className="h-4 w-20 skeleton rounded" />
    </div>
    <div className="space-y-2">
      <div className="flex justify-between">
        <div className="h-4 w-20 skeleton rounded" />
        <div className="h-4 w-8 skeleton rounded" />
      </div>
      <div className="h-2 w-full skeleton rounded-full" />
    </div>
  </div>
);

export const LoadingSpinner = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      className={cn('border-2 border-primary border-t-transparent rounded-full', sizeClasses[size])}
    />
  );
};
