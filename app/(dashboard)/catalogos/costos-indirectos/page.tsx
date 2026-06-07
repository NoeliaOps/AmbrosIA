import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import { PageHeader } from "@/components/layout/page-header"
import { CostsView } from "./_components/costs-view"

export const metadata: Metadata = { title: "Costos Indirectos" }

export default async function CostosIndirectosPage() {
  const supabase = await createClient()

  const [{ data: costs }, { data: overhead }, { data: events }] = await Promise.all([
    supabase
      .from("indirect_cost_categories")
      .select("id, name, default_amount, allocation_method, description, is_active")
      .order("name"),
    supabase
      .from("overhead_expenses")
      .select("id, concept, amount, period")
      .order("period", { ascending: false }),
    supabase
      .from("events")
      .select("event_date")
      .neq("status", "cancelado"),
  ])

  // Conteo de eventos por mes (para prorratear los gastos generales).
  const eventCounts: Record<string, number> = {}
  for (const e of events ?? []) {
    const key = (e.event_date as string).slice(0, 7)
    eventCounts[key] = (eventCounts[key] ?? 0) + 1
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Costos Indirectos"
        description="Gastos generales del negocio (gas, luz, renta…) prorrateados por evento, y reglas de costo por evento."
      />
      <CostsView
        costs={(costs ?? []) as Parameters<typeof CostsView>[0]["costs"]}
        overhead={(overhead ?? []) as Parameters<typeof CostsView>[0]["overhead"]}
        eventCounts={eventCounts}
      />
    </div>
  )
}
