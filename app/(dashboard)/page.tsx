import type { Metadata } from "next"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import {
  CalendarDays, FileText, TrendingUp, CreditCard,
  AlertTriangle, Clock, ClipboardList, Users, ArrowRight,
  CheckCircle, BarChart3, Package,
} from "lucide-react"
import { formatCurrency, formatShortDate } from "@/lib/utils"
import { PageHeader } from "@/components/layout/page-header"

export const metadata: Metadata = { title: "Dashboard" }

// Colores de etapa unificados con el pipeline de Eventos y el Calendario.
const STATUS_CFG: Record<string, { label: string; color: string }> = {
  cotizado:       { label: "Cotizado",       color: "#3D5A80" },
  contratado:     { label: "Contratado",     color: "#4C4F8A" },
  en_requisicion: { label: "En requisición", color: "#2C6E6A" },
  en_compras:     { label: "En compras",     color: "#9A5B3F" },
  completado:     { label: "Completado",     color: "#2F6B4F" },
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const now      = new Date()
  const today    = now.toISOString().slice(0, 10)
  const in7Days  = new Date(now.getTime() + 7 * 86400000).toISOString().slice(0, 10)
  const in30Days = new Date(now.getTime() + 30 * 86400000).toISOString().slice(0, 10)
  const monthStart    = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
  const monthEnd      = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10)
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000).toISOString()

  const [
    { data: activeEvents },
    { data: overduePayments },
    { data: upcomingPayments },
    { data: confirmedQuotes },
    { data: needsRequisition },
    { data: upcomingEvents },
    { data: profitData },
    { data: staleIngredients },
  ] = await Promise.all([
    supabase.from("events")
      .select("id, name, event_date, status, guest_count, clients(name)")
      .gte("event_date", monthStart).lte("event_date", monthEnd)
      .neq("status", "cancelado").order("event_date"),
    supabase.from("payment_schedules")
      .select("id, description, amount, due_date, events(id, name)")
      .eq("status", "pendiente").lt("due_date", today).order("due_date"),
    supabase.from("payment_schedules")
      .select("id, description, amount, due_date, events(id, name)")
      .eq("status", "pendiente").gte("due_date", today).lte("due_date", in7Days).order("due_date"),
    supabase.from("quotes").select("total, margin_percent").eq("status", "aprobada"),
    supabase.from("events")
      .select("id, name, event_date, requisitions(id)")
      .lte("event_date", in7Days).gte("event_date", today)
      .neq("status", "cancelado").neq("status", "completado"),
    supabase.from("events")
      .select("id, name, event_date, status, guest_count, clients(name)")
      .gt("event_date", today).lte("event_date", in30Days)
      .neq("status", "cancelado").neq("status", "completado")
      .order("event_date").limit(6),
    supabase.from("events")
      .select("quotes(total, status), actual_purchases(total_cost), event_indirect_costs(amount), event_staff_assignments(computed_cost)")
      .eq("status", "completado"),
    supabase.from("ingredients")
      .select("id, name, unit, current_price, updated_at")
      .lt("updated_at", thirtyDaysAgo)
      .order("updated_at")
      .limit(5),
  ])

  const totalConfirmed = (confirmedQuotes ?? []).reduce((s, q) => s + q.total, 0)
  const totalOverdue   = (overduePayments ?? []).reduce((s, p) => s + p.amount, 0)
  const eventsNeedingReq = (needsRequisition ?? []).filter((e) => {
    const reqs = e.requisitions as unknown as { id: string }[] | null
    return !reqs || reqs.length === 0
  })

  type QuoteRow   = { total: number; status: string }
  type CostRow    = { total_cost: number }
  type IndirectRow = { amount: number }
  type StaffRow   = { computed_cost: number }

  const margins = (profitData ?? []).flatMap((ev) => {
    const quotes   = ev.quotes as QuoteRow[] | null
    const actuals  = ev.actual_purchases as CostRow[] | null
    const indirects = ev.event_indirect_costs as IndirectRow[] | null
    const staff    = ev.event_staff_assignments as StaffRow[] | null
    const q = (quotes ?? []).find((q) => q.status === "aprobada")
    if (!q || q.total === 0) return []
    const costs = (actuals ?? []).reduce((s, a) => s + a.total_cost, 0)
      + (indirects ?? []).reduce((s, i) => s + i.amount, 0)
      + (staff ?? []).reduce((s, a) => s + a.computed_cost, 0)
    return [(q.total - costs) / q.total * 100]
  })
  const avgMargin = margins.length > 0 ? margins.reduce((s, m) => s + m, 0) / margins.length : null
  const inProcess = (activeEvents ?? []).filter((e) =>
    ["contratado", "en_compras", "en_requisicion"].includes(e.status)
  ).length
  const thisMonthIds = new Set((activeEvents ?? []).map((e) => e.id))
  const upcoming     = (upcomingEvents ?? []).filter((e) => !thisMonthIds.has(e.id))

  return (
    <div className="space-y-8 pb-8">
      {/* Page header */}
      <PageHeader
        title="Dashboard"
        description={`Resumen ejecutivo · ${new Date().toLocaleDateString("es-MX", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}`}
        actions={
          <Link href="/eventos" className="hidden sm:flex items-center gap-1.5 text-xs font-sans font-medium transition-colors border border-border rounded px-3 py-1.5 bg-card hover:border-gold/40" style={{ color: "var(--text-2)" }}>
            <CalendarDays size={13} />
            Ver todos los eventos
          </Link>
        }
      />

      {/* Alert banners */}
      <div className="space-y-3">
        {(overduePayments ?? []).length > 0 && (
          <div className="alert-banner border-l-[var(--ember)]">
            <div className="flex items-start gap-3">
              <AlertTriangle size={15} className="shrink-0 mt-0.5" style={{ color: "var(--ember)" }} />
              <div className="flex-1 min-w-0 space-y-2">
                <p className="text-sm font-sans font-semibold" style={{ color: "var(--text-1)" }}>
                  {(overduePayments ?? []).length} pago{(overduePayments ?? []).length !== 1 ? "s" : ""} vencido{(overduePayments ?? []).length !== 1 ? "s" : ""}
                  <span className="ml-2 font-normal mono-data" style={{ color: "var(--ember)", fontSize: "0.82rem" }}>· {formatCurrency(totalOverdue)}</span>
                </p>
                <div className="space-y-1">
                  {(overduePayments ?? []).map((p) => {
                    const ev = p.events as { id: string; name: string } | null
                    return (
                      <Link key={p.id} href="/pagos"
                        className="flex items-center justify-between gap-4 text-xs font-sans transition-colors group"
                        style={{ color: "var(--text-2)" }}>
                        <span className="truncate group-hover:text-foreground transition-colors">
                          {ev?.name ?? "Evento"} · {p.description}
                        </span>
                        <span className="mono-data font-medium shrink-0" style={{ color: "var(--text-1)", fontSize: "0.8rem" }}>{formatCurrency(p.amount)}</span>
                      </Link>
                    )
                  })}
                </div>
              </div>
              <Link href="/pagos" className="text-xs font-sans shrink-0 font-medium hover:underline transition-colors" style={{ color: "var(--ember)" }}>
                Gestionar →
              </Link>
            </div>
          </div>
        )}

        {(upcomingPayments ?? []).length > 0 && (
          <div className="alert-banner border-l-[var(--amber)]">
            <div className="flex items-start gap-3">
              <Clock size={15} className="shrink-0 mt-0.5" style={{ color: "var(--amber)" }} />
              <div className="flex-1 min-w-0 space-y-2">
                <p className="text-sm font-sans font-semibold" style={{ color: "var(--text-1)" }}>
                  {(upcomingPayments ?? []).length} cobro{(upcomingPayments ?? []).length !== 1 ? "s" : ""} próximos
                  <span className="ml-2 font-normal" style={{ color: "var(--text-2)", fontSize: "0.82rem" }}>próximos 7 días</span>
                </p>
                <div className="space-y-1">
                  {(upcomingPayments ?? []).map((p) => {
                    const ev = p.events as { id: string; name: string } | null
                    return (
                      <div key={p.id} className="flex items-center justify-between gap-4 text-xs font-sans" style={{ color: "var(--text-2)" }}>
                        <span className="truncate">{ev?.name ?? "—"} · {p.description}</span>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="mono-data font-medium" style={{ color: "var(--text-1)", fontSize: "0.8rem" }}>{formatCurrency(p.amount)}</span>
                          <span className="mono-data" style={{ color: "var(--amber)", fontSize: "0.75rem" }}>{p.due_date === today ? "Hoy" : formatShortDate(p.due_date)}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
              <Link href="/pagos" className="text-xs font-sans shrink-0 font-medium hover:underline transition-colors" style={{ color: "var(--amber)" }}>
                Ver pagos →
              </Link>
            </div>
          </div>
        )}

        {eventsNeedingReq.length > 0 && (
          <div className="alert-banner" style={{ borderLeftColor: "var(--status-info)" }}>
            <div className="flex items-start gap-3">
              <ClipboardList size={15} className="shrink-0 mt-0.5" style={{ color: "var(--status-info)" }} />
              <div className="flex-1 min-w-0 space-y-2">
                <p className="text-sm font-sans font-semibold" style={{ color: "var(--text-1)" }}>
                  {eventsNeedingReq.length} evento{eventsNeedingReq.length !== 1 ? "s" : ""} sin requisición
                  <span className="ml-2 font-normal" style={{ color: "var(--text-2)", fontSize: "0.82rem" }}>próximos 7 días</span>
                </p>
                <div className="space-y-1">
                  {eventsNeedingReq.map((e) => (
                    <Link key={e.id} href={`/eventos/${e.id}`}
                      className="flex items-center justify-between text-xs font-sans transition-colors group"
                      style={{ color: "var(--text-2)" }}>
                      <span className="truncate group-hover:text-foreground transition-colors">{e.name}</span>
                      <span className="mono-data shrink-0 ml-4" style={{ color: "var(--status-info)", fontSize: "0.75rem" }}>{formatShortDate(e.event_date)}</span>
                    </Link>
                  ))}
                </div>
              </div>
              <Link href="/requisiciones" className="text-xs font-sans shrink-0 font-medium hover:underline transition-colors" style={{ color: "var(--status-info)" }}>
                Ver →
              </Link>
            </div>
          </div>
        )}

        {(staleIngredients ?? []).length > 0 && (
          <div className="alert-banner" style={{ borderLeftColor: "var(--amber)" }}>
            <div className="flex items-start gap-3">
              <Package size={15} className="shrink-0 mt-0.5" style={{ color: "var(--amber)" }} />
              <div className="flex-1 min-w-0 space-y-2">
                <p className="text-sm font-sans font-semibold" style={{ color: "var(--text-1)" }}>
                  Precios de ingredientes desactualizados
                  <span className="ml-2 font-normal" style={{ color: "var(--text-2)", fontSize: "0.82rem" }}>sin actualizar hace +30 días</span>
                </p>
                <div className="space-y-1">
                  {(staleIngredients ?? []).map((ing) => {
                    const days = Math.floor((now.getTime() - new Date(ing.updated_at).getTime()) / 86400000)
                    return (
                      <div key={ing.id} className="flex items-center justify-between gap-4 text-xs font-sans" style={{ color: "var(--text-2)" }}>
                        <span className="truncate">{ing.name}</span>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="mono-data" style={{ color: "var(--text-1)", fontSize: "0.8rem" }}>{formatCurrency(ing.current_price)}<span style={{ color: "var(--text-3)" }}>/{ing.unit}</span></span>
                          <span className="mono-data" style={{ color: "var(--amber)", fontSize: "0.72rem" }}>hace {days}d</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
              <Link href="/catalogos/ingredientes" className="text-xs font-sans shrink-0 font-medium hover:underline transition-colors" style={{ color: "var(--amber)" }}>
                Actualizar →
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* KPI tiles */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 stagger-children">
        <KpiTile
          label="Eventos este mes"
          value={String((activeEvents ?? []).length)}
          sub={inProcess > 0 ? `${inProcess} en proceso activo` : "Sin eventos en proceso"}
          icon={CalendarDays}
          accent="gold"
        />
        <KpiTile
          label="Ingresos confirmados"
          value={formatCurrency(totalConfirmed)}
          sub={`${(confirmedQuotes ?? []).length} cotización${(confirmedQuotes ?? []).length !== 1 ? "es" : ""} aprobada${(confirmedQuotes ?? []).length !== 1 ? "s" : ""}`}
          icon={FileText}
          accent="emerald"
        />
        <KpiTile
          label="Cobros vencidos"
          value={totalOverdue > 0 ? formatCurrency(totalOverdue) : "Al día"}
          sub={totalOverdue > 0 ? `${(overduePayments ?? []).length} hito${(overduePayments ?? []).length !== 1 ? "s" : ""} sin cobrar` : "No hay pagos vencidos"}
          icon={CreditCard}
          accent={totalOverdue > 0 ? "red" : "emerald"}
        />
        <KpiTile
          label="Margen promedio"
          value={avgMargin !== null ? `${avgMargin.toFixed(1)}%` : "—"}
          sub={avgMargin !== null
            ? avgMargin >= 30 ? "Excelente · Por encima del objetivo"
            : avgMargin >= 20 ? "Saludable · En rango objetivo"
            : "Bajo objetivo · Revisar costos"
            : `${(profitData ?? []).length} evento${(profitData ?? []).length !== 1 ? "s" : ""} completado${(profitData ?? []).length !== 1 ? "s" : ""}`}
          icon={avgMargin !== null && avgMargin >= 20 ? TrendingUp : BarChart3}
          accent={avgMargin === null ? "gold" : avgMargin >= 20 ? "emerald" : "red"}
        />
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 animate-fade-up" style={{ animationDelay: "80ms" }}>
        {/* Events this month */}
        <div className="lg:col-span-3 space-y-0">
          <div className="section-header">
            <h2 style={{ fontFamily: "var(--font-display), Georgia, serif", fontSize: "1.125rem", fontWeight: 600, color: "var(--text-1)", letterSpacing: "-0.01em" }}>Este mes</h2>
            <Link href="/eventos" className="flex items-center gap-1 text-xs font-sans hover:text-amber transition-colors" style={{ color: "var(--text-3)" }}>
              Ver todos <ArrowRight size={12} />
            </Link>
          </div>

          {(activeEvents ?? []).length === 0 ? (
            <div className="enterprise-card flex items-center gap-4 p-8 text-center justify-center">
              <div className="text-center space-y-2">
                <CalendarDays size={28} className="mx-auto text-muted-foreground/30" />
                <p className="text-sm font-sans text-muted-foreground">Sin eventos este mes</p>
              </div>
            </div>
          ) : (
            <div className="enterprise-card overflow-hidden divide-y divide-border">
              {(activeEvents ?? []).map((e) => {
                const cfg = STATUS_CFG[e.status]
                const d   = new Date(e.event_date + "T12:00:00")
                return (
                  <Link key={e.id} href={`/eventos/${e.id}`}
                    className="flex items-center gap-4 px-4 py-3 table-row-hover">
                    <div className="w-10 shrink-0 text-center">
                      <p className="mono-data" style={{ fontSize: "1.25rem", fontWeight: 600, color: "var(--text-1)", lineHeight: 1 }}>{d.getDate()}</p>
                      <p style={{ fontFamily: "var(--font-mono), ui-monospace, monospace", fontSize: "0.52rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-3)", marginTop: "0.2rem" }}>
                        {d.toLocaleDateString("es-MX", { month: "short" })}
                      </p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p style={{ fontFamily: "var(--font-display), Georgia, serif", fontSize: "0.9375rem", fontWeight: 500, color: "var(--text-1)", letterSpacing: "0.01em", lineHeight: 1.3 }} className="truncate">{e.name}</p>
                      <p className="flex items-center gap-1.5 mt-0.5">
                        <span className="truncate" style={{ fontFamily: "var(--font-sans), system-ui, sans-serif", fontSize: "0.7rem", color: "var(--text-2)" }}>{(e.clients as { name: string } | null)?.name ?? "Sin cliente"}</span>
                        <span style={{ color: "var(--text-3)" }}>·</span>
                        <Users size={10} className="shrink-0" style={{ color: "var(--text-3)" }} />
                        <span className="mono-data" style={{ fontSize: "0.7rem", color: "var(--text-2)" }}>{e.guest_count}</span>
                      </p>
                    </div>
                    {cfg && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <div className="h-1.5 w-1.5 rounded-full" style={{ background: cfg.color }} />
                        <span style={{ fontFamily: "var(--font-mono), ui-monospace, monospace", fontSize: "0.65rem", letterSpacing: "0.08em", textTransform: "uppercase", color: cfg.color }}>{cfg.label}</span>
                      </div>
                    )}
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Upcoming events */}
          <div className="space-y-0">
            <div className="section-header">
              <h2 style={{ fontFamily: "var(--font-display), Georgia, serif", fontSize: "1.125rem", fontWeight: 600, color: "var(--text-1)", letterSpacing: "-0.01em" }}>Próximos 30 días</h2>
            </div>
            {upcoming.length === 0 ? (
              <div className="enterprise-card p-6 text-center">
                <CheckCircle size={22} className="mx-auto text-muted-foreground/30 mb-2" />
                <p className="text-xs font-sans text-muted-foreground">Sin eventos próximos</p>
              </div>
            ) : (
              <div className="enterprise-card overflow-hidden divide-y divide-border">
                {upcoming.map((e) => {
                  const cfg = STATUS_CFG[e.status]
                  const d   = new Date(e.event_date + "T12:00:00")
                  return (
                    <Link key={e.id} href={`/eventos/${e.id}`}
                      className="flex items-center gap-3 px-4 py-2.5 table-row-hover">
                      <div className="w-8 shrink-0 text-center">
                        <p className="mono-data" style={{ fontSize: "1.05rem", fontWeight: 600, color: "var(--text-1)", lineHeight: 1 }}>{d.getDate()}</p>
                        <p style={{ fontFamily: "var(--font-mono), ui-monospace, monospace", fontSize: "0.5rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-3)", marginTop: "0.2rem" }}>
                          {d.toLocaleDateString("es-MX", { month: "short" })}
                        </p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p style={{ fontFamily: "var(--font-display), Georgia, serif", fontSize: "0.875rem", fontWeight: 500, color: "var(--text-1)", letterSpacing: "0.01em" }} className="truncate">{e.name}</p>
                        <p style={{ fontFamily: "var(--font-sans), system-ui, sans-serif", fontSize: "0.65rem", color: "var(--text-2)" }} className="truncate">
                          {(e.clients as { name: string } | null)?.name ?? "—"}
                        </p>
                      </div>
                      {cfg && <div className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: cfg.color }} />}
                    </Link>
                  )
                })}
              </div>
            )}
          </div>

          {/* Quick stats */}
          <div className="space-y-0">
            <div className="section-header">
              <h2 style={{ fontFamily: "var(--font-display), Georgia, serif", fontSize: "1.125rem", fontWeight: 600, color: "var(--text-1)", letterSpacing: "-0.01em" }}>Resumen</h2>
            </div>
            <div className="enterprise-card divide-y divide-border">
              {[
                { label: "Cotizaciones aprobadas", value: String((confirmedQuotes ?? []).length) },
                { label: "Eventos completados",    value: String((profitData ?? []).length) },
                { label: "Próximos cobros (7d)",   value: String((upcomingPayments ?? []).length) },
                { label: "Eventos este mes",        value: String((activeEvents ?? []).length) },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between px-4 py-2.5">
                  <span style={{ fontFamily: "var(--font-sans), system-ui, sans-serif", fontSize: "0.75rem", color: "var(--text-2)" }}>{label}</span>
                  <span className="mono-data" style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--text-1)" }}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function KpiTile({
  label, value, sub, icon: Icon, accent,
}: {
  label: string
  value: string
  sub: string
  icon: React.ElementType
  accent: "gold" | "emerald" | "red" | "blue"
}) {
  const config = {
    gold:    { c: "#8B6D24" },
    emerald: { c: "#2F6B4F" },
    red:     { c: "#991B1B" },
    blue:    { c: "#3D5A80" },
  }[accent]
  const tile = { border: config.c, icon: config.c, iconBg: `color-mix(in srgb, ${config.c} 12%, white)` }

  const isMonetaryOrPercent = value.startsWith("$") || value.endsWith("%")

  return (
    <div className="kpi-tile" style={{ borderLeftColor: tile.border }}>
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1.5 min-w-0 flex-1">
          <p style={{
            fontFamily: "var(--font-mono), ui-monospace, monospace",
            fontSize: "0.6rem", fontWeight: 500,
            letterSpacing: "0.16em", textTransform: "uppercase",
            color: "var(--text-3)",
          }}>{label}</p>
          <p className={isMonetaryOrPercent ? "mono-data" : undefined} style={{
            fontFamily: isMonetaryOrPercent ? "var(--font-mono), ui-monospace, monospace" : "var(--font-display), Georgia, serif",
            fontSize: isMonetaryOrPercent ? "1.35rem" : "1.625rem",
            fontWeight: 600,
            letterSpacing: isMonetaryOrPercent ? "-0.01em" : "-0.02em",
            lineHeight: 1.05,
            color: "var(--text-1)",
            fontFeatureSettings: '"lnum" 1, "tnum" 1',
          }}>{value}</p>
          <p style={{
            fontFamily: "var(--font-sans), system-ui, sans-serif",
            fontSize: "0.72rem",
            color: "var(--text-3)",
            letterSpacing: "0.01em",
            lineHeight: 1.4,
          }}>{sub}</p>
        </div>
        <div className="shrink-0 rounded p-1.5" style={{ background: tile.iconBg }}>
          <Icon size={14} style={{ color: tile.icon }} />
        </div>
      </div>
    </div>
  )
}
