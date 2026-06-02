import type { Metadata } from "next"
import { PageHeader } from "@/components/layout/page-header"
import { LayoutTemplate } from "lucide-react"

export const metadata: Metadata = { title: "Plantillas" }

export default function PlantillasPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Plantillas" description="Menús y paquetes reutilizables para cotizar rápido." />
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4 text-center rounded-lg border border-dashed border-border p-16">
        <LayoutTemplate size={32} className="text-muted-foreground/30" />
        <p className="font-heading font-semibold text-ink">Próximamente</p>
        <p className="text-sm font-sans text-muted-foreground max-w-sm">
          Las plantillas de cotización están en desarrollo. Por ahora crea cotizaciones desde el detalle de cada evento.
        </p>
      </div>
    </div>
  )
}
