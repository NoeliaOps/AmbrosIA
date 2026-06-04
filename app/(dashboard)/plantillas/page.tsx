import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import { PageHeader } from "@/components/layout/page-header"
import { TemplateClient, type Template } from "./_components/template-client"

export const metadata: Metadata = { title: "Plantillas" }

export default async function PlantillasPage() {
  const supabase = await createClient()

  const { data } = await supabase
    .from("quote_templates")
    .select("id, name, event_type, description, price_per_guest, is_active, quote_template_items(id, description, quantity, unit_cost, sort_order)")
    .order("name")

  const templates = (data ?? []) as unknown as Template[]

  return (
    <div className="space-y-6">
      <PageHeader title="Plantillas" description="Paquetes de cotización reutilizables para cotizar rápido." />
      <TemplateClient templates={templates} />
    </div>
  )
}
