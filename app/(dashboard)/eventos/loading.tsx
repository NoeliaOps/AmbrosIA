import { Skeleton } from "@/components/ui/skeleton"
import { PageHeader } from "@/components/layout/page-header"

export default function Loading() {
  return (
    <div className="space-y-6">
      <PageHeader title="Eventos" description="Gestiona el ciclo de vida completo de cada evento." />
      <div className="space-y-4">
        <div className="flex justify-between">
          <div className="flex gap-2"><Skeleton className="h-9 w-64" /><Skeleton className="h-9 w-44" /></div>
          <Skeleton className="h-9 w-36" />
        </div>
        <div className="rounded-md border border-border overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex gap-4 p-4 border-b border-border last:border-0 items-center">
              <Skeleton className="h-10 w-14 rounded" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-64" />
              </div>
              <Skeleton className="h-6 w-24 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
