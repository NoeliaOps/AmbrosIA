import { Skeleton } from "@/components/ui/skeleton"
import { PageHeader } from "@/components/layout/page-header"

export default function Loading() {
  return (
    <div className="space-y-6">
      <PageHeader title="Personal por Evento" description="Asignaciones de personal por evento" />
      <div className="space-y-5">
        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-lg border border-border p-3 space-y-1.5">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-6 w-20" />
            </div>
          ))}
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-md border border-border overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3 bg-muted/40">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-5 w-24 rounded-full ml-2" />
            </div>
            {Array.from({ length: 3 }).map((_, j) => (
              <div key={j} className="flex gap-4 px-4 py-2.5 border-t border-border items-center">
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
