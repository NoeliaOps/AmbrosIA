import { Skeleton } from "@/components/ui/skeleton"
import { PageHeader } from "@/components/layout/page-header"

export default function Loading() {
  return (
    <div className="space-y-6">
      <PageHeader title="Menús" description="Combinaciones de platillos para distintos tipos de eventos." />
      <div className="space-y-4">
        <div className="flex justify-between">
          <Skeleton className="h-9 w-64" /><Skeleton className="h-9 w-36" />
        </div>
        <div className="rounded-md border border-border overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex gap-4 p-3 border-b border-border last:border-0">
              <Skeleton className="h-4 w-44" /><Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-20" /><Skeleton className="h-4 w-28" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
