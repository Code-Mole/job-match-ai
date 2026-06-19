// A single shimmer bar — used anywhere we're waiting for data
export default function Skeleton({ className = "" }) {
  return (
    <div
      className={`
      animate-pulse rounded-lg
      bg-slate-200 dark:bg-slate-700
      ${className}
    `}
    />
  );
}

// Full job card skeleton — matches JobCard dimensions
export  function JobCardSkeleton() {
  return (
    <div
      className="
      bg-white dark:bg-slate-800
      border border-slate-200 dark:border-white/8
      rounded-2xl p-5
    "
    >
      {/* Company logo + title row */}
      <div className="flex items-center gap-3 mb-4">
        <Skeleton className="w-10 h-10 rounded-xl flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>

      {/* Chips */}
      <div className="flex gap-2 mb-4">
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>

      {/* Match bar */}
      <div className="space-y-2 mb-4">
        <div className="flex justify-between">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-8" />
        </div>
        <Skeleton className="h-2 w-full rounded-full" />
      </div>

      {/* Button */}
      <Skeleton className="h-9 w-full rounded-xl" />
    </div>
  );
}
