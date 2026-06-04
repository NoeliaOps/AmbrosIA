import type { Metadata } from "next"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { PageHeader } from "@/components/layout/page-header"
import { formatCurrency, formatShortDate } from "@/lib/utils"
import { BarChart2, ExternalLink } from "lucide-react"

export const metadata: Metadata = { title: "Compras Reales" }

// Identidad del módulo (Abasto → vino)
const ACCENT = "#8A3F4D"

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
        <div className="enterprise-card p-16 text-center space-y-3">
          <BarChart2 size={32} className="mx-auto text-muted-foreground/40" />
          <p className="font-heading font-semibold">Sin compras registradas</p>
          <p className="text-sm font-sans text-muted-foreground">
            Registra las compras reales desde la pestaña Compras en el detalle de cada evento.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Resumen */}
          <div className="enterprise-card inline-flex items-center gap-5 px-5 py-3.5" style={{ borderLeft: `3px solid ${ACCENT}` }}>
            <div>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-3)" }}>Total comprado</p>
              <p className="mono-data" style={{ fontSize: "1.6rem", fontWeight: 700, color: ACCENT, lineHeight: 1.1 }}>{formatCurrency(grandTotal)}</p>
            </div>
            <div className="h-10 w-px" style={{ background: "var(--border-def, #EBEBEC)" }} />
            <div>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-3)" }}>Eventos</p>
              <p className="mono-data" style={{ fontSize: "1.6rem", fontWeight: 700, color: "var(--text-1)", lineHeight: 1.1 }}>{groups.length}</p>
            </div>
          </div>

          {/* Libro por evento */}
          {groups.map(({ event, items, total }) => (
            <div key={event.id} className="enterprise-card overflow-hidden">
              <div className="table-header px-4 py-2.5 flex items-center justify-between">
                <Link href={`/eventos/${event.id}`} className="flex items-center gap-1.5 hover:text-gold-dark transition-colors min-w-0">
                  <span style={{ fontFamily: "var(--font-display), Georgia, serif", fontSize: "0.95rem", fontWeight: 600, color: "var(--text-1)" }} className="truncate">{event.name}</span>
                  <ExternalLink size={12} className="text-muted-foreground/50 shrink-0" />
                  <span className="text-xs font-sans text-muted-foreground ml-1.5 shrink-0">{formatShortDate(event.event_date)}</span>
                </Link>
                <span className="mono-data shrink-0" style={{ fontSize: "0.95rem", fontWeight: 700, color: ACCENT }}>{formatCurrency(total)}</span>
              </div>

              <div className="overflow-x-auto">
                <div className="min-w-[640px]">
                  <div className="grid grid-cols-[1fr_90px_90px_100px_120px] gap-2 px-4 py-2 border-b border-border" style={{ fontFamily: "var(--font-mono)", fontSize: "0.58rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-3)" }}>
                    <span>Ingrediente</span>
                    <span className="text-right">Cantidad</span>
                    <span className="text-right">P. unit.</span>
                    <span className="text-right">Total</span>
                    <span>Fecha</span>
                  </div>
                  {items.map((p) => {
                    const ing = p.ingredients as { name: string; unit: string } | null
                    return (
                      <div key={p.id} className="grid grid-cols-[1fr_90px_90px_100px_120px] gap-2 px-4 py-2.5 border-t border-border items-center text-sm">
                        <span className="font-sans truncate" style={{ color: "var(--text-1)" }}>{ing?.name ?? "—"}</span>
                        <span className="mono-data text-right" style={{ color: "var(--text-2)" }}>{p.quantity.toFixed(3)} <span className="text-muted-foreground">{p.unit}</span></span>
                        <span className="mono-data text-right text-muted-foreground">{formatCurrency(p.unit_cost)}</span>
                        <span className="mono-data text-right font-semibold" style={{ color: "var(--text-1)" }}>{formatCurrency(p.total_cost)}</span>
                        <span className="mono-data text-muted-foreground" style={{ fontSize: "0.75rem" }}>{formatShortDate(p.purchased_at)}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
