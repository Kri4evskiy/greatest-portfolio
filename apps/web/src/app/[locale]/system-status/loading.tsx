import { Skeleton } from '@repo/ui'

export default function SystemStatusLoading() {
  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
      <div className="space-y-3 rounded-2xl border border-border bg-card p-5 shadow-xs sm:p-6">
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-5 w-32 rounded-full" />
          <Skeleton className="h-5 w-28 rounded-full" />
        </div>
        <Skeleton className="h-8 w-72" />
        <Skeleton className="h-4 w-full max-w-2xl" />
      </div>

      <div className="rounded-xl border border-border bg-card p-5 shadow-xs">
        <Skeleton className="mb-4 h-6 w-56" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 7 }, (_, idx) => (
            <Skeleton key={`status-node-skeleton-${String(idx)}`} className="h-28 w-full rounded-lg" />
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5 shadow-xs">
        <Skeleton className="mb-4 h-6 w-64" />
        <div className="space-y-2">
          {Array.from({ length: 4 }, (_, idx) => (
            <Skeleton key={`status-row-skeleton-${String(idx)}`} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  )
}
