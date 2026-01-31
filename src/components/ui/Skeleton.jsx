function Skeleton({ className = '', variant = 'default' }) {
  const baseStyles = 'animate-pulse bg-slate-200 dark:bg-gray-700 rounded';
  
  const variants = {
    default: '',
    circle: 'rounded-full',
    text: 'h-4',
    title: 'h-6',
    card: 'h-32'
  };

  return (
    <div
      className={`${baseStyles} ${variants[variant]} ${className}`}
      aria-hidden="true"
    />
  );
}

function ServiceCardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <Skeleton variant="circle" className="w-10 h-10" />
          <div className="space-y-2">
            <Skeleton variant="title" className="w-32" />
            <Skeleton variant="text" className="w-48" />
          </div>
        </div>
        <Skeleton variant="circle" className="w-8 h-8" />
      </div>

      {/* Status */}
      <div className="flex items-center gap-4 mb-4">
        <Skeleton className="w-20 h-8 rounded-full" />
        <Skeleton variant="text" className="w-24" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <Skeleton className="h-16 rounded-lg" />
        <Skeleton className="h-16 rounded-lg" />
        <Skeleton className="h-16 rounded-lg" />
      </div>

      {/* Buttons */}
      <div className="flex gap-2">
        <Skeleton className="h-10 flex-1 rounded-lg" />
        <Skeleton className="h-10 flex-1 rounded-lg" />
      </div>
    </div>
  );
}

function DashboardStatsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-4">
            <Skeleton variant="circle" className="w-12 h-12" />
            <div className="space-y-2">
              <Skeleton variant="text" className="w-20" />
              <Skeleton variant="title" className="w-16" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ServiceListSkeleton({ count = 6 }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {[...Array(count)].map((_, i) => (
        <ServiceCardSkeleton key={i} />
      ))}
    </div>
  );
}

function TableRowSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 border-b border-slate-200 dark:border-gray-700">
      <Skeleton variant="circle" className="w-8 h-8" />
      <div className="flex-1 space-y-2">
        <Skeleton variant="title" className="w-32" />
        <Skeleton variant="text" className="w-48" />
      </div>
      <Skeleton className="w-20 h-6 rounded-full" />
      <Skeleton variant="text" className="w-16" />
      <div className="flex gap-2">
        <Skeleton variant="circle" className="w-8 h-8" />
        <Skeleton variant="circle" className="w-8 h-8" />
      </div>
    </div>
  );
}

export { Skeleton, ServiceCardSkeleton, DashboardStatsSkeleton, ServiceListSkeleton, TableRowSkeleton };
