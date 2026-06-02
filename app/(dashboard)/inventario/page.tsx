import type { Metadata } from "next"
import { PageHeader } from "@/components/layout/page-header"
import { Warehouse } from "lucide-react"

export const metadata: Metadata = { title: "Inventario" }

export default function InventarioPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Inventario" description="Control básico de almacén e insumos en stock." />
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4 text-center rounded-lg border border-dashed border-border p-16">
        <Warehouse size={32} className="text-muted-foreground/30" />
        <p className="font-heading font-semibold text-ink">Próximamente</p>
        <p className="text-sm font-sans text-muted-foreground max-w-sm">
          El módulo de inventario está en desarrollo.
        </p>
      </div>
    </div>
  )
}
