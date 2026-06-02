import { Skeleton } from "@/components/ui/skeleton"
import { PageHeader } from "@/components/layout/page-header"

export default function Loading() {
  return (
    <div className="space-y-6">
      <PageHeader title="Requisiciones" description="Solicitudes de compra por evento" />
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-9 w-36" />
        </div>
        <div className="rounded-md border border-border overflow-hidden">
          <div className="flex gap-4 px-4 py-2.5 bg-muted/40">
            {[160, 80, 100, 80, 70].map((w, i) => (
              <Skeleton key={i} className="h-3" style={{ width: w }} />
            ))}
          </div>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-4 px-4 py-3 border-t border-border items-center">
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-44" />
                <Skeleton className="h-3 w-28" />
              </div>
              <Skeleton className="h-5 w-28 rounded-full" />
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-8 w-24 rounded-md" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
