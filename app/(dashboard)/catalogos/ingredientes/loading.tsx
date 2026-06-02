import { Skeleton } from "@/components/ui/skeleton"
import { PageHeader } from "@/components/layout/page-header"

export default function Loading() {
  return (
    <div className="space-y-6">
      <PageHeader title="Ingredientes" description="Catálogo de insumos con precios actuales." />
      <div className="space-y-4">
        <div className="flex justify-between">
          <Skeleton className="h-9 w-64" /><Skeleton className="h-9 w-44" />
        </div>
        <div className="rounded-md border border-border overflow-hidden">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex gap-4 p-3 border-b border-border last:border-0">
              <Skeleton className="h-4 w-44" /><Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16" /><Skeleton className="h-4 w-24" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
