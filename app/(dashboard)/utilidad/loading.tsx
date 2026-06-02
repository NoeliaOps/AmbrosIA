import { Skeleton } from "@/components/ui/skeleton"
import { PageHeader } from "@/components/layout/page-header"

export default function Loading() {
  return (
    <div className="space-y-6">
      <PageHeader title="Utilidad Real" description="Estado de resultados por evento" />
      <div className="space-y-5">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="rounded-lg border border-border p-3 space-y-1.5">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-6 w-28" />
            </div>
          ))}
        </div>
        <div className="rounded-md border border-border overflow-hidden">
          <div className="flex gap-4 px-4 py-2.5 bg-muted/40">
            {[120, 80, 90, 90, 90, 90, 90, 90, 70].map((w, i) => (
              <Skeleton key={i} className="h-3" style={{ width: w }} />
            ))}
          </div>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex gap-4 px-4 py-3 border-t border-border items-center">
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-5 w-24 rounded-full" />
              <Skeleton className="h-3 w-20 ml-auto" />
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-14" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
