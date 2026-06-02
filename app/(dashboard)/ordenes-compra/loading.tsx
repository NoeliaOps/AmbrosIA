import { Skeleton } from "@/components/ui/skeleton"
import { PageHeader } from "@/components/layout/page-header"

export default function Loading() {
  return (
    <div className="space-y-6">
      <PageHeader title="Órdenes de Compra" description="Órdenes enviadas a proveedores" />
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-9 w-40" />
        </div>
        <div className="rounded-md border border-border overflow-hidden">
          <div className="flex gap-4 px-4 py-2.5 bg-muted/40">
            {[80, 160, 120, 80, 100, 70].map((w, i) => (
              <Skeleton key={i} className="h-3" style={{ width: w }} />
            ))}
          </div>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-4 px-4 py-3 border-t border-border items-center">
              <Skeleton className="h-4 w-16" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-28" />
              </div>
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-5 w-24 rounded-full" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-20 rounded-md" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
