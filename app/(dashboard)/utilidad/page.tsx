import type { Metadata } from "next"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { PageHeader } from "@/components/layout/page-header"
import { formatCurrency, formatShortDate } from "@/lib/utils"
import { TrendingUp, TrendingDown, ChevronLeft, ChevronRight, Minus, Equal } from "lucide-react"

export const metadata: Metadata = { title: "Utilidad Real" }

const PAGE_SIZE = 20

// Identidad del módulo (Finanzas → esmeralda) + paleta de costos
const ACCENT = "#1F6E55"
const C_INSUMOS = "#9A5B3F"   // arcilla
const C_INDIRECT = "#6B4A2F"  // cacao
const C_PERSONAL = "#4A5568"  // acero
const LOSS = "#991B1B"

const EVENT_STATUS_LABEL: Record<string, string> = {
  cotizado: "Cotizado",
  contratado: "Contratado",
  en_requisicion: "En requisición",
  en_compras: "En compras",
  completado: "Completado",
  cancelado: "Cancelado",
}
const EVENT_STATUS_CLASS: Record<string, string> = {
  cotizado: "pill-info",
  contratado: "pill-active",
  en_requisicion: "pill-warning",
  en_compras: "pill-warning",
  completado: "pill-done",
  cancelado: "pill-danger",
}

export default async function UtilidadPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const { page: pageParam } = await searchParams
  const page = Math.max(1, parseInt(pageParam ?? "1", 10))
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
  const totalMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : null

  // Anchura proporcional de cada segmento sobre los ingresos (para la barra)
  const pct = (v: number) => (totalRevenue > 0 ? (v / totalRevenue) * 100 : 0)

  return (
    <div className="space-y-6">
      <PageHeader title="Utilidad Real" description="Estado de resultados por evento" />

      {rows.length === 0 ? (
        <div className="enterprise-card p-16 text-center space-y-3">
          <TrendingUp size={32} className="mx-auto text-muted-foreground/40" />
          <p className="font-heading font-semibold">Sin datos disponibles</p>
          <p className="text-sm font-sans text-muted-foreground">
            Crea eventos con cotizaciones y registra compras reales para ver el análisis de utilidad.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* ════════ ESTADO DE RESULTADOS CONSOLIDADO ════════ */}
          <div className="enterprise-card p-5 sm:p-6 space-y-5">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--text-3)" }}>
                  Estado de resultados consolidado
                </p>
                <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.75rem", color: "var(--text-3)", marginTop: "0.15rem" }}>
                  {rows.length} evento{rows.length !== 1 ? "s" : ""} · {hasActuals ? "compras reales" : "estimado por cotización"}
                </p>
              </div>
              <div className="text-right">
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-3)" }}>
                  Utilidad {hasActuals ? "real" : "estimada"}
                </p>
                <p className="mono-data" style={{ fontSize: "1.85rem", fontWeight: 700, lineHeight: 1.1, color: totalProfit >= 0 ? ACCENT : LOSS }}>
                  {formatCurrency(totalProfit)}
                </p>
                {totalMargin !== null && (
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", fontWeight: 600, color: totalProfit >= 0 ? ACCENT : LOSS }}>
                    margen {totalMargin.toFixed(1)}%
                  </p>
                )}
              </div>
            </div>

            {/* Barra de composición de ingresos */}
            {totalRevenue > 0 && (
              <div>
                <div className="flex h-3.5 w-full overflow-hidden rounded-full" style={{ background: "var(--surface-3, #EBEBEC)" }}>
                  {[
                    { v: totalIngredients, c: C_INSUMOS },
                    { v: totalIndirect, c: C_INDIRECT },
                    { v: totalStaff, c: C_PERSONAL },
                    { v: Math.max(0, totalProfit), c: ACCENT },
                  ].filter((s) => s.v > 0).map((s, i) => (
                    <div key={i} style={{ width: `${pct(s.v)}%`, background: s.c }} title={formatCurrency(s.v)} />
                  ))}
                </div>
                <div className="mt-2.5 flex flex-wrap gap-x-5 gap-y-1.5">
                  {[
                    { label: "Insumos", v: totalIngredients, c: C_INSUMOS },
                    { label: "Indirectos", v: totalIndirect, c: C_INDIRECT },
                    { label: "Personal", v: totalStaff, c: C_PERSONAL },
                    { label: totalProfit >= 0 ? "Utilidad" : "Pérdida", v: Math.abs(totalProfit), c: totalProfit >= 0 ? ACCENT : LOSS },
                  ].map((s) => (
                    <div key={s.label} className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-sm" style={{ background: s.c }} />
                      <span style={{ fontFamily: "var(--font-sans)", fontSize: "0.72rem", color: "var(--text-2)" }}>{s.label}</span>
                      <span className="mono-data" style={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--text-1)" }}>{pct(s.v).toFixed(0)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Líneas del estado de resultados */}
            <div className="space-y-0">
              <StatementLine label="Ingresos" amount={totalRevenue} pct={100} bold />
              <StatementLine label="Insumos (compras)" amount={-totalIngredients} pct={pct(totalIngredients)} sign="minus" dim />
              <StatementLine label="Costos indirectos" amount={-totalIndirect} pct={pct(totalIndirect)} sign="minus" dim />
              <StatementLine label="Personal" amount={-totalStaff} pct={pct(totalStaff)} sign="minus" dim />
              <StatementLine label={totalProfit >= 0 ? "Utilidad" : "Pérdida"} amount={totalProfit} pct={totalMargin ?? 0} sign="equal" result resultColor={totalProfit >= 0 ? ACCENT : LOSS} />
            </div>
          </div>

          {/* ════════ DESGLOSE POR EVENTO ════════ */}
          <div className="enterprise-card overflow-hidden">
            <div className="table-header px-4 py-2.5 flex items-center justify-between">
              <span className="text-[11px] font-sans font-semibold uppercase tracking-wider text-muted-foreground">Por evento</span>
              <span className="text-[11px] font-sans text-muted-foreground">{count} en total</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm font-sans min-w-[720px]">
                <thead>
                  <tr style={{ fontSize: "0.65rem" }} className="font-semibold uppercase tracking-wider text-muted-foreground border-b border-border">
                    <th className="px-4 py-2 text-left">Evento</th>
                    <th className="px-3 py-2 text-left">Fecha</th>
                    <th className="px-3 py-2 text-right">Ingresos</th>
                    <th className="px-3 py-2 text-right">Insumos</th>
                    <th className="px-3 py-2 text-right">Indirectos</th>
                    <th className="px-3 py-2 text-right">Personal</th>
                    <th className="px-3 py-2 text-right">Utilidad</th>
                    <th className="px-3 py-2 text-right">Margen</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((ev) => {
                    const profitPositive = ev.profit >= 0
                    return (
                      <tr key={ev.id} className="border-t border-border table-row-hover">
                        <td className="px-4 py-3">
                          <Link href={`/eventos/${ev.id}`} className="font-medium hover:text-gold-dark transition-colors" style={{ fontFamily: "var(--font-display), Georgia, serif", fontSize: "0.9rem" }}>
                            {ev.name}
                          </Link>
                          <p className="mt-0.5">
                            <span className={`status-pill ${EVENT_STATUS_CLASS[ev.status] ?? ""}`}>
                              {EVENT_STATUS_LABEL[ev.status] ?? ev.status}
                            </span>
                          </p>
                        </td>
                        <td className="px-3 py-3 text-muted-foreground whitespace-nowrap mono-data" style={{ fontSize: "0.78rem" }}>
                          {formatShortDate(ev.event_date)}
                        </td>
                        <td className="px-3 py-3 text-right mono-data font-medium">
                          {ev.revenue > 0 ? formatCurrency(ev.revenue) : <span className="text-muted-foreground">—</span>}
                        </td>
                        <td className="px-3 py-3 text-right mono-data" style={{ color: ev.ingredientCost > 0 ? C_INSUMOS : "var(--text-3)" }}>
                          {ev.ingredientCost > 0 ? formatCurrency(ev.ingredientCost) : "—"}
                        </td>
                        <td className="px-3 py-3 text-right mono-data" style={{ color: ev.indirectCost > 0 ? C_INDIRECT : "var(--text-3)" }}>
                          {ev.indirectCost > 0 ? formatCurrency(ev.indirectCost) : "—"}
                        </td>
                        <td className="px-3 py-3 text-right mono-data" style={{ color: ev.staffCost > 0 ? C_PERSONAL : "var(--text-3)" }}>
                          {ev.staffCost > 0 ? formatCurrency(ev.staffCost) : "—"}
                        </td>
                        <td className="px-3 py-3 text-right mono-data font-semibold" style={{ color: ev.revenue === 0 ? "var(--text-3)" : profitPositive ? ACCENT : LOSS }}>
                          {ev.revenue === 0 ? "—" : (
                            <span className="flex items-center justify-end gap-1">
                              {profitPositive ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                              {formatCurrency(ev.profit)}
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-3 text-right mono-data font-medium" style={{
                          color: ev.margin === null ? "var(--text-3)" : ev.margin >= 20 ? ACCENT : ev.margin >= 10 ? "#8B6D24" : LOSS,
                        }}>
                          {ev.margin !== null ? `${ev.margin.toFixed(1)}%` : "—"}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {!hasActuals && (
            <p className="text-sm font-sans text-muted-foreground italic">
              Registra compras reales en la pestaña <strong>Compras</strong> de cada evento para ver la utilidad real.
            </p>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-xs font-sans text-muted-foreground">Página {page} de {totalPages} · {count} eventos</p>
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

function StatementLine({
  label, amount, pct, sign, bold, dim, result, resultColor,
}: {
  label: string
  amount: number
  pct: number
  sign?: "minus" | "equal"
  bold?: boolean
  dim?: boolean
  result?: boolean
  resultColor?: string
}) {
  return (
    <div
      className="flex items-center justify-between py-2.5"
      style={{
        borderTop: result ? "2px solid var(--text-1, #1A1A1A)" : "1px solid var(--border-def, #EBEBEC)",
        marginTop: result ? "0.25rem" : undefined,
      }}
    >
      <div className="flex items-center gap-2">
        {sign === "minus" && <Minus size={12} className="text-muted-foreground" />}
        {sign === "equal" && <Equal size={13} style={{ color: resultColor }} />}
        <span style={{
          fontFamily: result || bold ? "var(--font-display), Georgia, serif" : "var(--font-sans)",
          fontSize: result ? "1rem" : "0.85rem",
          fontWeight: result || bold ? 600 : 400,
          color: dim ? "var(--text-2)" : "var(--text-1)",
        }}>{label}</span>
      </div>
      <div className="flex items-baseline gap-3">
        <span className="mono-data hidden sm:inline" style={{ fontSize: "0.7rem", color: "var(--text-3)", width: "3rem", textAlign: "right" }}>
          {pct.toFixed(0)}%
        </span>
        <span className="mono-data" style={{
          fontSize: result ? "1.1rem" : "0.9rem",
          fontWeight: result || bold ? 700 : 500,
          color: result ? resultColor : dim ? "var(--text-2)" : "var(--text-1)",
        }}>
          {formatCurrency(amount)}
        </span>
      </div>
    </div>
  )
}
