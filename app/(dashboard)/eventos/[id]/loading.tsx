import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-72" />
        <Skeleton className="h-4 w-48" />
      </div>
      <div className="flex gap-2">
        {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-8 w-24 rounded-full" />)}
      </div>
      <div className="flex gap-6 border-b border-border pb-0">
        {["Resumen", "Cotización", "Contrato"].map((t) => (
          <Skeleton key={t} className="h-8 w-24" />
        ))}
      </div>
      <div className="space-y-4">
        <Skeleton className="h-32 w-full rounded-lg" />
        <Skeleton className="h-48 w-full rounded-lg" />
      </div>
    </div>
  )
}
