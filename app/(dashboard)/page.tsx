import type { Metadata } from "next"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import {
  CalendarDays, TrendingUp, AlertTriangle, Clock, ClipboardList,
  Users, ArrowRight, CheckCircle2, Package, Wallet, Layers, ChevronRight, CircleDollarSign,
} from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { PageHeader } from "@/components/layout/page-header"
import { DashboardPeriod, type PresetKey } from "./_components/dashboard-period"
import { PeriodStats, type TypeStat, type MonthStat } from "./_components/period-stats"

export const metadata: Metadata = { title: "Dashboard" }

// Resuelve el rango de fechas del periodo seleccionado (preset o personalizado).
function resolvePeriod(preset: string | undefined, from?: string, to?: string, ref: Date = new Date()) {
  const iso = (d: Date) => d.toISOString().slice(0, 10)
  const y = ref.getFullYear()
  const m = ref.getMonth()
  const longMonth = (d: Date) => d.toLocaleDateString("es-MX", { month: "long", year: "numeric" })

  if (preset === "custom" && from && to) {
    const f = new Date(from + "T12:00:00"), t = new Date(to + "T12:00:00")
    return { key: "custom" as const, start: from, end: to, label: `${f.toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" })} – ${t.toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" })}` }
  }
  if (preset === "month") {
    return { key: "month" as PresetKey, start: iso(new Date(y, m, 1)), end: iso(new Date(y, m + 1, 0)), label: longMonth(ref).replace(/^\w/, (c) => c.toUpperCase()) }
  }
  if (preset === "quarter") {
    const q = Math.floor(m / 3)
    const start = new Date(y, q * 3, 1), end = new Date(y, q * 3 + 3, 0)
    return { key: "quarter" as PresetKey, start: iso(start), end: iso(end), label: `${q + 1}.º trimestre ${y}` }
  }
  if (preset === "12m") {
    const start = new Date(ref.getTime() - 364 * 86400000)
    return { key: "12m" as PresetKey, start: iso(start), end: iso(ref), label: "Últimos 12 meses" }
  }
  // default: este año
  return { key: "year" as PresetKey, start: iso(new Date(y, 0, 1)), end: iso(new Date(y, 11, 31)), label: `Año ${y}` }
}

// Etapas del pipeline, en orden y con sus colores (unificados con Eventos y Calendario).
const STAGES = [
  { key: "cotizado",       label: "Cotizado",       color: "#3D5A80" },
  { key: "contratado",     label: "Contratado",     color: "#4C4F8A" },
  { key: "en_requisicion", label: "En requisición", color: "#2C6E6A" },
  { key: "en_compras",     label: "En compras",     color: "#9A5B3F" },
  { key: "completado",     label: "Completado",     color: "#2F6B4F" },
] as const
const STATUS_CFG = Object.fromEntries(STAGES.map((s) => [s.key, s])) as Record<string, (typeof STAGES)[number]>

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ preset?: string; from?: string; to?: string }>
}) {
  const { preset, from, to } = await searchParams
  const supabase = await createClient()
  const now      = new Date()
  const today    = now.toISOString().slice(0, 10)
  const period   = resolvePeriod(preset, from, to, now)
  const in7Days  = new Date(now.getTime() + 7 * 86400000).toISOString().slice(0, 10)
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000).toISOString()

  const [
    { data: pendingPayments },
    { data: upcomingPayments },
    { data: needsRequisition },
    { data: nextEvents },
    { data: profitData },
    { data: staleIngredients },
    { data: periodEvents },
  ] = await Promise.all([
    supabase.from("payment_schedules")
      .select("id, description, amount, due_date, events(id, name)")
      .eq("status", "pendiente").order("due_date"),
    supabase.from("payment_schedules")
      .select("id, description, amount, due_date, events(id, name)")
      .eq("status", "pendiente").gte("due_date", today).lte("due_date", in7Days).order("due_date"),
    supabase.from("events")
      .select("id, name, event_date, requisitions(id)")
      .lte("event_date", in7Days).gte("event_date", today)
      .neq("status", "cancelado").neq("status", "completado"),
    supabase.from("events")
      .select("id, name, event_date, status, guest_count, clients(name)")
      .gte("event_date", today)
      .neq("status", "cancelado").neq("status", "completado")
      .order("event_date").limit(7),
    supabase.from("events")
      .select("quotes(total, status), actual_purchases(total_cost), event_indirect_costs(amount), event_staff_assignments(computed_cost)")
      .eq("status", "completado"),
    supabase.from("ingredients")
      .select("id, name, unit, current_price, updated_at")
      .lt("updated_at", thirtyDaysAgo)
      .order("updated_at")
      .limit(5),
    supabase.from("events")
      .select("id, event_type, event_date, status, guest_count, quotes(total, status, version_number)")
      .gte("event_date", period.start).lte("event_date", period.end)
      .neq("status", "cancelado").order("event_date"),
  ])

  // ── Cobranza ────────────────────────────────────────────────────────────────
  type PayRow = { id: string; description: string; amount: number; due_date: string; events: { id: string; name: string } | null }
  const pending = (pendingPayments ?? []) as unknown as PayRow[]
  const overduePayments = pending.filter((p) => p.due_date < today)
  const totalPending = pending.reduce((s, p) => s + p.amount, 0)
  const totalOverdue = overduePayments.reduce((s, p) => s + p.amount, 0)
  const upcomingPay = (upcomingPayments ?? []) as unknown as PayRow[]
  const upcomingPayTotal = upcomingPay.reduce((s, p) => s + p.amount, 0)

  const eventsNeedingReq = (needsRequisition ?? []).filter((e) => {
    const reqs = e.requisitions as unknown as { id: string }[] | null
    return !reqs || reqs.length === 0
  })

  // ── Margen real (eventos completados) ────────────────────────────────────────
  type QuoteRow = { total: number; status: string }
  type CostRow = { total_cost: number }
  type IndirectRow = { amount: number }
  type StaffRow = { computed_cost: number }
  const margins = (profitData ?? []).flatMap((ev) => {
    const quotes = ev.quotes as QuoteRow[] | null
    const actuals = ev.actual_purchases as CostRow[] | null
    const indirects = ev.event_indirect_costs as IndirectRow[] | null
    const staff = ev.event_staff_assignments as StaffRow[] | null
    const q = (quotes ?? []).find((q) => q.status === "aprobada")
    if (!q || q.total === 0) return []
    const costs = (actuals ?? []).reduce((s, a) => s + a.total_cost, 0)
      + (indirects ?? []).reduce((s, i) => s + i.amount, 0)
      + (staff ?? []).reduce((s, a) => s + a.computed_cost, 0)
    return [(q.total - costs) / q.total * 100]
  })
  const avgMargin = margins.length > 0 ? margins.reduce((s, m) => s + m, 0) / margins.length : null

  // ── Estadísticas del periodo ──────────────────────────────────────────────
  type PeriodQuote = { total: number; status: string; version_number: number }
  const eventRevenue = (quotes: PeriodQuote[] | null) => {
    const sorted = [...(quotes ?? [])].sort((a, b) => b.version_number - a.version_number)
    return sorted.find((q) => q.status === "aprobada")?.total ?? sorted[0]?.total ?? 0
  }
  const periodRows = (periodEvents ?? []).map((e) => ({
    type: (e.event_type && e.event_type.trim()) ? e.event_type.trim() : "Sin tipo",
    status: e.status as string,
    date: e.event_date as string,
    guests: e.guest_count ?? 0,
    occurred: (e.event_date as string) <= today,
    revenue: eventRevenue(e.quotes as PeriodQuote[] | null),
  }))

  const eventsTotal   = periodRows.length
  const occurredCount = periodRows.filter((r) => r.occurred).length
  const guestsServed  = periodRows.filter((r) => r.occurred).reduce((s, r) => s + r.guests, 0)
  const guestsBooked  = periodRows.filter((r) => !r.occurred).reduce((s, r) => s + r.guests, 0)
  const periodRevenue = periodRows.reduce((s, r) => s + r.revenue, 0)
  const guestsTotal   = guestsServed + guestsBooked

  // Embudo por etapa (dentro del periodo)
  const stageCounts: Record<string, number> = {}
  for (const r of periodRows) stageCounts[r.status] = (stageCounts[r.status] ?? 0) + 1
  const stageMax = Math.max(1, ...STAGES.map((s) => stageCounts[s.key] ?? 0))

  const typeMap = new Map<string, TypeStat>()
  for (const r of periodRows) {
    const cur = typeMap.get(r.type) ?? { type: r.type, count: 0, guests: 0, revenue: 0 }
    cur.count += 1; cur.guests += r.guests; cur.revenue += r.revenue
    typeMap.set(r.type, cur)
  }
  const byType: TypeStat[] = [...typeMap.values()].sort((a, b) => b.guests - a.guests)

  // Distribución mensual de personas atendidas (solo eventos ya realizados).
  const monthMap = new Map<string, MonthStat>()
  const pStart = new Date(period.start + "T12:00:00")
  const pEnd   = new Date(period.end + "T12:00:00")
  const monthsSpan = (pEnd.getFullYear() - pStart.getFullYear()) * 12 + (pEnd.getMonth() - pStart.getMonth()) + 1
  if (monthsSpan <= 12) {
    for (let i = 0; i < monthsSpan; i++) {
      const d = new Date(pStart.getFullYear(), pStart.getMonth() + i, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
      monthMap.set(key, { key, label: d.toLocaleDateString("es-MX", { month: "short" }), guests: 0, count: 0 })
    }
  }
  for (const r of periodRows) {
    if (!r.occurred) continue
    const cur = monthMap.get(r.date.slice(0, 7))
    if (cur) { cur.guests += r.guests; cur.count += 1 }
  }
  const byMonth: MonthStat[] = [...monthMap.values()]

  // ── Pulso del negocio (frase resumen) ────────────────────────────────────────
  const eventsThisWeek = (nextEvents ?? []).filter((e) => (e.event_date as string) <= in7Days).length
  const pulse = [
    eventsThisWeek > 0 ? `${eventsThisWeek} evento${eventsThisWeek !== 1 ? "s" : ""} esta semana` : null,
    overduePayments.length > 0 ? `${overduePayments.length} cobro${overduePayments.length !== 1 ? "s" : ""} vencido${overduePayments.length !== 1 ? "s" : ""}` : null,
    avgMargin !== null ? `margen real ${avgMargin.toFixed(0)}%` : null,
  ].filter(Boolean).join("  ·  ")

  const attention = [
    overduePayments.length > 0 && { icon: AlertTriangle, color: "#991B1B", title: `${overduePayments.length} cobro${overduePayments.length !== 1 ? "s" : ""} vencido${overduePayments.length !== 1 ? "s" : ""}`, detail: formatCurrency(totalOverdue), sample: overduePayments[0]?.events?.name, href: "/pagos" },
    upcomingPay.length > 0 && { icon: Clock, color: "#8B6D24", title: `${upcomingPay.length} cobro${upcomingPay.length !== 1 ? "s" : ""} esta semana`, detail: formatCurrency(upcomingPayTotal), sample: upcomingPay[0]?.events?.name, href: "/pagos" },
    eventsNeedingReq.length > 0 && { icon: ClipboardList, color: "#1E40AF", title: `${eventsNeedingReq.length} evento${eventsNeedingReq.length !== 1 ? "s" : ""} sin requisición`, detail: "próximos 7 días", sample: eventsNeedingReq[0]?.name, href: "/requisiciones" },
    (staleIngredients ?? []).length > 0 && { icon: Package, color: "#8B6D24", title: `${(staleIngredients ?? []).length} precios desactualizados`, detail: "+30 días", sample: staleIngredients?.[0]?.name, href: "/catalogos/ingredientes" },
  ].filter(Boolean) as { icon: React.ElementType; color: string; title: string; detail: string; sample?: string; href: string }[]

  const marginColor = avgMargin === null ? "#8B6D24" : avgMargin >= 20 ? "#2F6B4F" : avgMargin >= 10 ? "#8B6D24" : "#991B1B"

  return (
    <div className="space-y-7 pb-8">
      {/* ════════ Encabezado + palanca de periodo ════════ */}
      <PageHeader
        title="Resumen ejecutivo"
        description={pulse || new Date().toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        actions={
          <DashboardPeriod
            activePreset={period.key}
            from={period.key === "custom" ? period.start : ""}
            to={period.key === "custom" ? period.end : ""}
          />
        }
      />

      {/* ════════ Banda de KPIs estrella ════════ */}
      <div className="enterprise-card overflow-hidden animate-fade-up">
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-y divide-x divide-border lg:divide-y-0">
          <StatCell
            primary
            label="Ingresos del periodo"
            value={formatCurrency(periodRevenue)}
            sub={`${eventsTotal} evento${eventsTotal !== 1 ? "s" : ""} · ${period.label}`}
            accent="#2F6B4F"
            icon={CircleDollarSign}
          />
          <StatCell
            label="Margen real promedio"
            value={avgMargin !== null ? `${avgMargin.toFixed(1)}%` : "—"}
            sub={avgMargin === null ? "Sin eventos cerrados" : avgMargin >= 20 ? "En rango objetivo" : avgMargin >= 10 ? "Por debajo del objetivo" : "Revisar costos"}
            accent={marginColor}
            icon={TrendingUp}
          />
          <StatCell
            label="Por cobrar"
            value={formatCurrency(totalPending)}
            sub={totalOverdue > 0 ? `${overduePayments.length} vencido${overduePayments.length !== 1 ? "s" : ""} · ${formatCurrency(totalOverdue)}` : "Sin vencidos"}
            subDanger={totalOverdue > 0}
            accent={totalOverdue > 0 ? "#991B1B" : "#4A5568"}
            icon={Wallet}
          />
          <StatCell
            label="Personas del periodo"
            value={guestsTotal.toLocaleString("es-MX")}
            sub={`${guestsServed.toLocaleString("es-MX")} atendidas · ${guestsBooked.toLocaleString("es-MX")} por atender`}
            accent="#9A5B3F"
            icon={Users}
          />
        </div>
      </div>

      {/* ════════ Requiere tu atención ════════ */}
      <div className="animate-fade-up" style={{ animationDelay: "40ms" }}>
        <div className="section-header">
          <h2 className="dash-h2">Requiere tu atención</h2>
          {attention.length > 0 && (
            <span className="mono-data" style={{ fontSize: "0.7rem", color: "var(--text-3)" }}>{attention.length} pendiente{attention.length !== 1 ? "s" : ""}</span>
          )}
        </div>
        {attention.length === 0 ? (
          <div className="enterprise-card flex items-center gap-3 px-4 py-4">
            <CheckCircle2 size={18} style={{ color: "#2F6B4F" }} />
            <p className="text-sm font-sans" style={{ color: "var(--text-2)" }}>Todo en orden — sin pendientes urgentes.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {attention.map((a, i) => (
              <Link key={i} href={a.href}
                className="enterprise-card flex items-center gap-3 px-4 py-3 group transition-colors"
                style={{ borderLeft: `3px solid ${a.color}` }}>
                <span className="shrink-0 rounded-md p-1.5" style={{ background: `color-mix(in srgb, ${a.color} 12%, white)` }}>
                  <a.icon size={15} style={{ color: a.color }} />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-sans font-semibold truncate" style={{ color: "var(--text-1)" }}>{a.title}</p>
                  {a.sample && <p className="text-xs font-sans truncate" style={{ color: "var(--text-3)" }}>{a.sample}</p>}
                </div>
                <span className="mono-data shrink-0" style={{ fontSize: "0.78rem", fontWeight: 600, color: a.color }}>{a.detail}</span>
                <ChevronRight size={15} className="shrink-0 transition-transform group-hover:translate-x-0.5" style={{ color: "var(--text-3)" }} />
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* ════════ Estadísticas del periodo ════════ */}
      <div className="animate-fade-up" style={{ animationDelay: "60ms" }}>
        <PeriodStats
          periodLabel={period.label}
          eventsTotal={eventsTotal}
          occurredCount={occurredCount}
          guestsServed={guestsServed}
          guestsBooked={guestsBooked}
          revenue={periodRevenue}
          byType={byType}
          byMonth={byMonth}
        />
      </div>

      {/* ════════ Próximos eventos + embudo por etapa ════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 animate-fade-up" style={{ animationDelay: "80ms" }}>
        {/* Próximos eventos */}
        <div className="lg:col-span-3 space-y-0">
          <div className="section-header">
            <h2 className="dash-h2">Próximos eventos</h2>
            <Link href="/eventos" className="flex items-center gap-1 text-xs font-sans hover:text-amber transition-colors" style={{ color: "var(--text-3)" }}>
              Ver todos <ArrowRight size={12} />
            </Link>
          </div>
          {(nextEvents ?? []).length === 0 ? (
            <div className="enterprise-card p-8 text-center">
              <CalendarDays size={26} className="mx-auto text-muted-foreground/30 mb-2" />
              <p className="text-sm font-sans text-muted-foreground">Sin eventos próximos en agenda</p>
            </div>
          ) : (
            <div className="enterprise-card overflow-hidden divide-y divide-border">
              {(nextEvents ?? []).map((e) => {
                const cfg = STATUS_CFG[e.status]
                const d = new Date(e.event_date + "T12:00:00")
                const days = Math.round((d.getTime() - new Date(today + "T12:00:00").getTime()) / 86400000)
                return (
                  <Link key={e.id} href={`/eventos/${e.id}`} className="flex items-center gap-4 px-4 py-3 table-row-hover">
                    <div className="w-10 shrink-0 text-center">
                      <p className="mono-data" style={{ fontSize: "1.25rem", fontWeight: 600, color: "var(--text-1)", lineHeight: 1 }}>{d.getDate()}</p>
                      <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.52rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-3)", marginTop: "0.2rem" }}>
                        {d.toLocaleDateString("es-MX", { month: "short" })}
                      </p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p style={{ fontFamily: "var(--font-display), Georgia, serif", fontSize: "0.9375rem", fontWeight: 500, color: "var(--text-1)", lineHeight: 1.3 }} className="truncate">{e.name}</p>
                      <p className="flex items-center gap-1.5 mt-0.5">
                        <span className="truncate" style={{ fontFamily: "var(--font-sans)", fontSize: "0.7rem", color: "var(--text-2)" }}>{(e.clients as { name: string } | null)?.name ?? "Sin cliente"}</span>
                        <span style={{ color: "var(--text-3)" }}>·</span>
                        <Users size={10} className="shrink-0" style={{ color: "var(--text-3)" }} />
                        <span className="mono-data" style={{ fontSize: "0.7rem", color: "var(--text-2)" }}>{e.guest_count}</span>
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="mono-data" style={{ fontSize: "0.68rem", color: days <= 7 ? "#8B6D24" : "var(--text-3)" }}>
                        {days === 0 ? "Hoy" : days === 1 ? "Mañana" : `en ${days} d`}
                      </p>
                      {cfg && (
                        <p className="flex items-center justify-end gap-1 mt-0.5">
                          <span className="h-1.5 w-1.5 rounded-full" style={{ background: cfg.color }} />
                          <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.06em", textTransform: "uppercase", color: cfg.color }}>{cfg.label}</span>
                        </p>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {/* Embudo por etapa */}
        <div className="lg:col-span-2 space-y-0">
          <div className="section-header">
            <h2 className="dash-h2">Por etapa</h2>
            <span className="flex items-center gap-1 text-xs font-sans" style={{ color: "var(--text-3)" }}>
              <Layers size={12} /> {period.label}
            </span>
          </div>
          <div className="enterprise-card p-4 space-y-3">
            {eventsTotal === 0 ? (
              <p className="text-sm font-sans text-muted-foreground text-center py-6">Sin eventos en el periodo</p>
            ) : (
              STAGES.map((s) => {
                const n = stageCounts[s.key] ?? 0
                return (
                  <Link key={s.key} href="/eventos" className="block group">
                    <div className="flex items-center justify-between gap-3 mb-1">
                      <span className="flex items-center gap-2 min-w-0">
                        <span className="h-2.5 w-2.5 rounded-sm shrink-0" style={{ background: s.color }} />
                        <span className="text-sm font-sans truncate transition-colors group-hover:text-foreground" style={{ color: "var(--text-2)" }}>{s.label}</span>
                      </span>
                      <span className="mono-data shrink-0" style={{ fontSize: "0.85rem", fontWeight: 600, color: n > 0 ? "var(--text-1)" : "var(--text-3)" }}>{n}</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ background: "var(--surface-3, #EBEBEC)" }}>
                      <div className="h-full rounded-full transition-all" style={{ width: `${(n / stageMax) * 100}%`, background: s.color }} />
                    </div>
                  </Link>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCell({
  label, value, sub, accent, icon: Icon, primary, subDanger,
}: {
  label: string
  value: string
  sub: string
  accent: string
  icon: React.ElementType
  primary?: boolean
  subDanger?: boolean
}) {
  return (
    <div className="relative p-5 sm:p-6" style={primary ? { background: "color-mix(in srgb, #2F6B4F 4%, white)" } : undefined}>
      {primary && <span className="absolute left-0 top-0 h-full w-[3px]" style={{ background: accent }} />}
      <div className="flex items-start justify-between gap-2">
        <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", fontWeight: 500, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-3)" }}>{label}</p>
        <span className="shrink-0 rounded-md p-1" style={{ background: `color-mix(in srgb, ${accent} 12%, white)` }}>
          <Icon size={13} style={{ color: accent }} />
        </span>
      </div>
      <p className="mono-data" style={{
        fontSize: primary ? "1.9rem" : "1.45rem",
        fontWeight: 700, lineHeight: 1.05, letterSpacing: "-0.01em",
        color: "var(--text-1)", marginTop: "0.5rem",
        fontFeatureSettings: '"lnum" 1, "tnum" 1',
      }}>{value}</p>
      <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.72rem", lineHeight: 1.4, marginTop: "0.3rem", color: subDanger ? "#991B1B" : "var(--text-3)" }}>{sub}</p>
    </div>
  )
}
