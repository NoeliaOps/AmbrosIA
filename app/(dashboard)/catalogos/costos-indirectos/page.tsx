import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import { PageHeader } from "@/components/layout/page-header"
import { CostsView } from "./_components/costs-view"
import { weekStartKey } from "@/lib/utils"

export const metadata: Metadata = { title: "Costos Indirectos" }

export default async function CostosIndirectosPage() {
  const supabase = await createClient()

  const [{ data: costs }, { data: overheadAll }, { data: events }] = await Promise.all([
    supabase
      .from("indirect_cost_categories")
      .select("id, name, default_amount, allocation_method, description, is_active")
      .order("name"),
    supabase
      .from("overhead_expenses")
      .select("id, concept, amount, period, period_type, kind")
      .order("period", { ascending: false }),
    supabase
      .from("events")
      .select("event_date")
      .neq("status", "cancelado"),
  ])

  // Conteo de eventos por mes y por semana (denominadores del prorrateo).
  const eventCounts: Record<string, number> = {}
  const eventCountsWeek: Record<string, number> = {}
  for (const e of events ?? []) {
    const date = e.event_date as string
    const m = date.slice(0, 7)
    eventCounts[m] = (eventCounts[m] ?? 0) + 1
    const w = weekStartKey(date)
    eventCountsWeek[w] = (eventCountsWeek[w] ?? 0) + 1
  }

  const all = (overheadAll ?? []) as Parameters<typeof CostsView>[0]["overhead"]
  const overhead = all.filter((o) => o.kind !== "service")
  const services = all.filter((o) => o.kind === "service")

  return (
    <div className="space-y-6">
      <PageHeader
        title="Costos Indirectos"
        description="Gastos generales (gas, luz, renta…) y servicios (seguridad, valet, mobiliario…) prorrateados por evento, más las reglas de costo por evento."
      />
      <CostsView
        costs={(costs ?? []) as Parameters<typeof CostsView>[0]["costs"]}
        overhead={overhead}
        services={services}
        eventCounts={eventCounts}
        eventCountsWeek={eventCountsWeek}
      />
    </div>
  )
}
