import type { Metadata } from "next"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { PageHeader } from "@/components/layout/page-header"
import { formatCurrency, formatShortDate } from "@/lib/utils"
import { TrendingUp, TrendingDown, ChevronLeft, ChevronRight } from "lucide-react"

export const metadata: Metadata = { title: "Utilidad Real" }

const PAGE_SIZE = 20

const EVENT_STATUS_LABEL: Record<string, string> = {
  cotizado: "Cotizado",
  contratado: "Contratado",
  en_requisicion: "En requisición",
  en_compras: "En compras",
  completado: "Completado",
  cancelado: "Cancelado",
}

const EVENT_STATUS_CLASS: Record<string, string> = {
  cotizado:       "pill-info",
  contratado:     "pill-active",
  en_requisicion: "pill-warning",
  en_compras:     "pill-warning",
  completado:     "pill-done",
  cancelado:      "pill-danger",
}

export default async function UtilidadPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const { page: pageParam } = await searchParams
  const page   = Math.max(1, parseInt(pageParam ?? "1", 10))
  const offset = (page - 1) * PAGE_SIZE

  const supabase = await createClient()

  const { data: events, count } = await supabase
    .from("events")
    .select(`
      id, name, event_date, status, guest_count,
      quotes(total, status, version_number),
      actual_purchases(total_cost),
      event_indirect_costs(amount),
      event_staff_assignments(computed_cost)
    `, { count: "exact" })
    .neq("status", "cancelado")
    .order("event_date", { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1)

  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE)

  type QuoteRow = { total: number; status: string; version_number: number }
  type CostRow = { total_cost: number }
  type IndirectRow = { amount: number }
  type StaffRow = { computed_cost: number }

  const rows = (events ?? []).map((ev) => {
    const quotes = ev.quotes as QuoteRow[] | null
    const actuals = ev.actual_purchases as CostRow[] | null
    const indirects = ev.event_indirect_costs as IndirectRow[] | null
    const staffAssignments = ev.event_staff_assignments as StaffRow[] | null

    const sortedQuotes = [...(quotes ?? [])].sort((a, b) => b.version_number - a.version_number)
    const approvedQuote = sortedQuotes.find((q) => q.status === "aprobada")
    // Fallback: latest quote version (not max), so a negotiated-down price is correct
    const revenue = approvedQuote?.total ?? sortedQuotes[0]?.total ?? 0
    const ingredientCost = (actuals ?? []).reduce((s, a) => s + a.total_cost, 0)
    const indirectCost = (indirects ?? []).reduce((s, i) => s + i.amount, 0)
    const staffCost = (staffAssignments ?? []).reduce((s, a) => s + a.computed_cost, 0)
    const profit = revenue - ingredientCost - indirectCost - staffCost
    const margin = revenue > 0 ? (profit / revenue) * 100 : null

    return { ...ev, revenue, ingredientCost, indirectCost, staffCost, profit, margin }
  })

  const hasActuals = rows.some((r) => r.ingredientCost > 0)

  const totalRevenue = rows.reduce((s, r) => s + r.revenue, 0)
  const totalIngredients = rows.reduce((s, r) => s + r.ingredientCost, 0)
  const totalIndirect = rows.reduce((s, r) => s + r.indirectCost, 0)
  const totalStaff = rows.reduce((s, r) => s + r.staffCost, 0)
  const totalProfit = totalRevenue - totalIngredients - totalIndirect - totalStaff

  return (
    <div className="space-y-6">
      <PageHeader
        title="Utilidad Real"
        description="Estado de resultados por evento"
      />

      {rows.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-16 text-center space-y-3">
          <TrendingUp size={32} className="mx-auto text-muted-foreground" />
          <p className="font-heading font-semibold">Sin datos disponibles</p>
          <p className="text-sm font-sans text-muted-foreground">
            Crea eventos con cotizaciones y registra compras reales para ver el análisis de utilidad.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Summary KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { label: "Ingresos totales", value: formatCurrency(totalRevenue), className: "" },
              { label: "Costo insumos", value: formatCurrency(totalIngredients), className: "text-red-700" },
              { label: "Costos indirectos", value: formatCurrency(totalIndirect), className: "text-red-700" },
              { label: "Personal", value: formatCurrency(totalStaff), className: "text-red-700" },
              {
                label: "Utilidad estimada",
                value: formatCurrency(totalProfit),
                className: totalProfit >= 0 ? "text-emerald-700" : "text-red-700",
              },
            ].map((kpi) => (
              <div key={kpi.label} className="rounded-lg border border-border p-3 space-y-0.5">
                <p className="text-xs font-sans text-muted-foreground">{kpi.label}</p>
                <p className={`text-lg font-heading font-bold tabular-nums ${kpi.className}`}>{kpi.value}</p>
              </div>
            ))}
          </div>

          {/* P&L table */}
          <div className="rounded-md border border-border overflow-x-auto">
            <table className="w-full text-sm font-sans">
              <thead>
                <tr className="bg-muted/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-2.5 text-left">Evento</th>
                  <th className="px-3 py-2.5 text-left">Fecha</th>
                  <th className="px-3 py-2.5 text-left">Estado</th>
                  <th className="px-3 py-2.5 text-right">Ingresos</th>
                  <th className="px-3 py-2.5 text-right">Insumos</th>
                  <th className="px-3 py-2.5 text-right">Indirectos</th>
                  <th className="px-3 py-2.5 text-right">Personal</th>
                  <th className="px-3 py-2.5 text-right">Utilidad</th>
                  <th className="px-3 py-2.5 text-right">Margen</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((ev) => {
                  const statusCfg = EVENT_STATUS_CLASS[ev.status] ?? ""
                  const profitPositive = ev.profit >= 0
                  return (
                    <tr key={ev.id} className="border-t border-border hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3">
                        <Link href={`/eventos/${ev.id}`} className="font-medium hover:underline">
                          {ev.name}
                        </Link>
                        <p className="text-xs text-muted-foreground">{ev.guest_count} invitados</p>
                      </td>
                      <td className="px-3 py-3 text-muted-foreground whitespace-nowrap">
                        {formatShortDate(ev.event_date)}
                      </td>
                      <td className="px-3 py-3">
                        <span className={`status-pill ${statusCfg}`}>
                          {EVENT_STATUS_LABEL[ev.status] ?? ev.status}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums font-medium">
                        {ev.revenue > 0 ? formatCurrency(ev.revenue) : <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums text-red-700">
                        {ev.ingredientCost > 0 ? formatCurrency(ev.ingredientCost) : <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums text-red-700">
                        {ev.indirectCost > 0 ? formatCurrency(ev.indirectCost) : <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums text-red-700">
                        {ev.staffCost > 0 ? formatCurrency(ev.staffCost) : <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className={`px-3 py-3 text-right tabular-nums font-semibold ${ev.revenue === 0 ? "text-muted-foreground" : profitPositive ? "text-emerald-700" : "text-red-700"}`}>
                        {ev.revenue === 0 ? "—" : (
                          <span className="flex items-center justify-end gap-1">
                            {profitPositive ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                            {formatCurrency(ev.profit)}
                          </span>
                        )}
                      </td>
                      <td className={`px-3 py-3 text-right tabular-nums font-medium ${
                        ev.margin === null ? "text-muted-foreground" :
                        ev.margin >= 20 ? "text-emerald-700" :
                        ev.margin >= 10 ? "text-amber-700" : "text-red-700"
                      }`}>
                        {ev.margin !== null ? `${ev.margin.toFixed(1)}%` : "—"}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              {rows.length > 1 && (
                <tfoot>
                  <tr className="border-t-2 border-border bg-muted/30 font-semibold">
                    <td className="px-4 py-3" colSpan={3}>Total</td>
                    <td className="px-3 py-3 text-right tabular-nums">{formatCurrency(totalRevenue)}</td>
                    <td className="px-3 py-3 text-right tabular-nums text-red-700">{formatCurrency(totalIngredients)}</td>
                    <td className="px-3 py-3 text-right tabular-nums text-red-700">{formatCurrency(totalIndirect)}</td>
                    <td className="px-3 py-3 text-right tabular-nums text-red-700">{formatCurrency(totalStaff)}</td>
                    <td className={`px-3 py-3 text-right tabular-nums ${totalProfit >= 0 ? "text-emerald-700" : "text-red-700"}`}>
                      {formatCurrency(totalProfit)}
                    </td>
                    <td className={`px-3 py-3 text-right tabular-nums ${
                      totalRevenue > 0
                        ? (totalProfit / totalRevenue) * 100 >= 20 ? "text-emerald-700"
                        : (totalProfit / totalRevenue) * 100 >= 10 ? "text-amber-700" : "text-red-700"
                        : "text-muted-foreground"
                    }`}>
                      {totalRevenue > 0 ? `${((totalProfit / totalRevenue) * 100).toFixed(1)}%` : "—"}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          {!hasActuals && (
            <p className="text-sm font-sans text-muted-foreground italic">
              Registra compras reales en la pestaña <strong>Compras</strong> de cada evento para ver la utilidad real.
            </p>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-xs font-sans text-muted-foreground">
                Página {page} de {totalPages} · {count} eventos
              </p>
              <div className="flex gap-1.5">
                {page > 1 && (
                  <Link href={`/utilidad?page=${page - 1}`} className="inline-flex items-center gap-1 h-7 rounded-md border border-border bg-card px-2.5 text-xs font-sans text-muted-foreground hover:text-foreground hover:border-gold/40 transition-colors">
                    <ChevronLeft size={12} /> Anterior
                  </Link>
                )}
                {page < totalPages && (
                  <Link href={`/utilidad?page=${page + 1}`} className="inline-flex items-center gap-1 h-7 rounded-md border border-border bg-card px-2.5 text-xs font-sans text-muted-foreground hover:text-foreground hover:border-gold/40 transition-colors">
                    Siguiente <ChevronRight size={12} />
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
