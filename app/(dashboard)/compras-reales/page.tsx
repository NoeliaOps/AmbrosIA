import type { Metadata } from "next"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { PageHeader } from "@/components/layout/page-header"
import { formatCurrency, formatShortDate } from "@/lib/utils"
import { BarChart2 } from "lucide-react"

export const metadata: Metadata = { title: "Compras Reales" }

export default async function ComprasRealesPage() {
  const supabase = await createClient()

  type PurchaseRow = {
    id: string
    quantity: number
    unit: string
    unit_cost: number
    total_cost: number
    purchased_at: string
    notes: string | null
    ingredients: { name: string; unit: string } | null
    events: { id: string; name: string; event_date: string } | null
  }

  const { data: rawPurchases } = await supabase
    .from("actual_purchases")
    .select(`
      id, quantity, unit, unit_cost, total_cost, purchased_at, notes,
      ingredients(name, unit),
      events(id, name, event_date)
    `)
    .order("purchased_at", { ascending: false })

  const rows = (rawPurchases as unknown as PurchaseRow[]) ?? []

  // Group by event
  const byEvent = new Map<string, {
    event: { id: string; name: string; event_date: string }
    items: typeof rows
    total: number
  }>()

  for (const p of rows) {
    const ev = p.events as { id: string; name: string; event_date: string } | null
    if (!ev) continue
    const key = ev.id
    if (!byEvent.has(key)) byEvent.set(key, { event: ev, items: [], total: 0 })
    const group = byEvent.get(key)!
    group.items.push(p)
    group.total += p.total_cost
  }

  const groups = Array.from(byEvent.values()).sort(
    (a, b) => b.event.event_date.localeCompare(a.event.event_date)
  )

  const grandTotal = rows.reduce((s, p) => s + p.total_cost, 0)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Compras Reales"
        description="Registro histórico de compras de insumos por evento"
      />

      {groups.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-16 text-center space-y-3">
          <BarChart2 size={32} className="mx-auto text-muted-foreground" />
          <p className="font-heading font-semibold">Sin compras registradas</p>
          <p className="text-sm font-sans text-muted-foreground">
            Registra las compras reales desde la pestaña Compras en el detalle de cada evento.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Grand total KPI */}
          <div className="inline-flex items-center gap-3 rounded-lg border border-border px-4 py-3">
            <div>
              <p className="text-xs font-sans text-muted-foreground uppercase tracking-wider">Total comprado</p>
              <p className="text-2xl font-heading font-bold tabular-nums">{formatCurrency(grandTotal)}</p>
            </div>
            <div className="h-10 w-px bg-border" />
            <div>
              <p className="text-xs font-sans text-muted-foreground uppercase tracking-wider">Eventos</p>
              <p className="text-2xl font-heading font-bold">{groups.length}</p>
            </div>
          </div>

          {groups.map(({ event, items, total }) => (
            <div key={event.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <Link href={`/eventos/${event.id}`} className="font-heading font-semibold hover:underline">
                    {event.name}
                  </Link>
                  <span className="text-xs font-sans text-muted-foreground ml-3">
                    {formatShortDate(event.event_date)}
                  </span>
                </div>
                <span className="font-sans font-semibold tabular-nums">{formatCurrency(total)}</span>
              </div>
              <div className="rounded-md border border-border overflow-hidden">
                <div className="grid grid-cols-[1fr_80px_80px_90px_90px_120px] gap-2 px-3 py-2 bg-muted/40 text-xs font-sans font-semibold uppercase tracking-wider text-muted-foreground">
                  <span>Ingrediente</span>
                  <span className="text-right">Cantidad</span>
                  <span>Unidad</span>
                  <span className="text-right">P. unit.</span>
                  <span className="text-right">Total</span>
                  <span>Fecha</span>
                </div>
                {items.map((p) => {
                  const ing = p.ingredients as { name: string; unit: string } | null
                  return (
                    <div key={p.id} className="grid grid-cols-[1fr_80px_80px_90px_90px_120px] gap-2 px-3 py-2.5 border-t border-border text-sm font-sans items-center">
                      <span className="font-medium">{ing?.name ?? "—"}</span>
                      <span className="tabular-nums text-right">{p.quantity.toFixed(3)}</span>
                      <span className="text-muted-foreground">{p.unit}</span>
                      <span className="tabular-nums text-right text-muted-foreground">{formatCurrency(p.unit_cost)}</span>
                      <span className="tabular-nums text-right font-medium">{formatCurrency(p.total_cost)}</span>
                      <span className="text-muted-foreground">{formatShortDate(p.purchased_at)}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
