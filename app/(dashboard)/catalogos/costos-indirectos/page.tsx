import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import { PageHeader } from "@/components/layout/page-header"
import { IndirectCostClient } from "./_components/indirect-cost-client"

export const metadata: Metadata = { title: "Costos Indirectos" }

export default async function CostosIndirectosPage() {
  const supabase = await createClient()

  const { data: costs } = await supabase
    .from("indirect_cost_categories")
    .select("id, name, default_amount, allocation_method, description, is_active")
    .order("name")

  return (
    <div className="space-y-6">
      <PageHeader
        title="Costos Indirectos"
        description="Gastos fijos y variables que se aplican a tus eventos: renta, traslados, utilería, etc."
      />
      <IndirectCostClient costs={(costs ?? []) as Parameters<typeof IndirectCostClient>[0]["costs"]} />
    </div>
  )
}
