import type { Metadata } from "next"
import { PageHeader } from "@/components/layout/page-header"
import { ModuleComingSoon } from "@/components/layout/module-coming-soon"
import { Warehouse } from "lucide-react"

export const metadata: Metadata = { title: "Inventario" }

export default function InventarioPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Inventario" description="Control básico de almacén e insumos en stock." />
      <ModuleComingSoon
        accent="#6B4A2F"
        icon={Warehouse}
        headline="Lleva el stock de tu almacén al día"
        capabilities={[
          "Existencias por insumo, con su unidad y costo actual",
          "Alertas cuando un insumo baja de su mínimo",
          "Descuento automático de existencias al registrar compras y eventos",
        ]}
        cta={{ label: "Ver ingredientes", href: "/catalogos/ingredientes" }}
      />
    </div>
  )
}
