import type { Metadata } from "next"
import { PageHeader } from "@/components/layout/page-header"
import { ModuleComingSoon } from "@/components/layout/module-coming-soon"
import { LayoutTemplate } from "lucide-react"

export const metadata: Metadata = { title: "Plantillas" }

export default function PlantillasPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Plantillas" description="Menús y paquetes reutilizables para cotizar rápido." />
      <ModuleComingSoon
        accent="#4C4F8A"
        icon={LayoutTemplate}
        headline="Cotiza en segundos con paquetes reutilizables"
        capabilities={[
          "Guarda combinaciones de platillos como paquetes con precio por persona",
          "Aplica una plantilla a una cotización con un solo clic",
          "Mantén versiones por temporada o tipo de evento",
        ]}
        cta={{ label: "Ver menús", href: "/catalogos/menus" }}
      />
    </div>
  )
}
