import type { Metadata } from "next"
import { PageHeader } from "@/components/layout/page-header"
import { ModuleComingSoon } from "@/components/layout/module-coming-soon"
import { MessageSquare } from "lucide-react"

export const metadata: Metadata = { title: "Post-mortem" }

export default function PostmortemPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Post-mortem" description="Notas y lecciones aprendidas por evento." />
      <ModuleComingSoon
        accent="#3C3C3C"
        icon={MessageSquare}
        headline="Aprende de cada evento para mejorar el siguiente"
        capabilities={[
          "Registra qué salió bien y qué mejorar después de cada evento",
          "Compara lo estimado contra lo real (costos, personal, tiempos)",
          "Convierte las lecciones en notas accionables para próximos eventos",
        ]}
        cta={{ label: "Ver eventos", href: "/eventos" }}
      />
    </div>
  )
}
