import type { ReactNode } from "react"
import { Users, CalendarRange, TrendingUp, UtensilsCrossed } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

export type TypeStat = { type: string; count: number; guests: number; revenue: number }
export type MonthStat = { key: string; label: string; guests: number; count: number }

// Paleta editorial cíclica para tipos de evento (sin depender de nombres fijos).
const TYPE_COLORS = ["#9A5B3F", "#3D5A80", "#2F6B4F", "#7C3A6B", "#8B6D24", "#4A5568", "#2C6E6A"]

export function PeriodStats({
  periodLabel,
  eventsTotal,
  occurredCount,
  guestsServed,
  guestsBooked,
  revenue,
  byType,
  byMonth,
  selector,
}: {
  periodLabel: string
  eventsTotal: number
  occurredCount: number
  guestsServed: number
  guestsBooked: number
  revenue: number
  byType: TypeStat[]
  byMonth: MonthStat[]
  selector?: ReactNode
}) {
  const avgPerEvent = occurredCount > 0 ? Math.round(guestsServed / occurredCount) : 0
  const maxTypeGuests = Math.max(1, ...byType.map((t) => t.guests))
  const maxMonthGuests = Math.max(1, ...byMonth.map((m) => m.guests))

  return (
    <div className="enterprise-card p-5 sm:p-6 space-y-6">
      {/* Header + period selector */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--text-3)" }}>
            Estadísticas del periodo
          </p>
          <h2 style={{ fontFamily: "var(--font-display), Georgia, serif", fontSize: "1.125rem", fontWeight: 600, color: "var(--text-1)", letterSpacing: "-0.01em", marginTop: "0.15rem" }}>
            {periodLabel}
          </h2>
        </div>
        {selector}
      </div>

      {eventsTotal === 0 ? (
        <div className="py-10 text-center space-y-2">
          <CalendarRange size={26} className="mx-auto text-muted-foreground/40" />
          <p className="text-sm font-sans text-muted-foreground">Sin eventos en este periodo</p>
        </div>
      ) : (
        <>
          {/* KPIs del periodo */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <PeriodKpi
              icon={Users}
              accent="#2F6B4F"
              label="Personas atendidas"
              value={guestsServed.toLocaleString("es-MX")}
              sub={guestsBooked > 0 ? `+${guestsBooked.toLocaleString("es-MX")} por atender` : `${occurredCount} evento${occurredCount !== 1 ? "s" : ""} realizado${occurredCount !== 1 ? "s" : ""}`}
            />
            <PeriodKpi
              icon={CalendarRange}
              accent="#8B6D24"
              label="Eventos"
              value={String(eventsTotal)}
              sub={`${occurredCount} realizado${occurredCount !== 1 ? "s" : ""} · ${eventsTotal - occurredCount} por venir`}
            />
            <PeriodKpi
              icon={TrendingUp}
              accent="#3D5A80"
              label="Ingresos del periodo"
              value={formatCurrency(revenue)}
              sub="Cotización aprobada por evento"
            />
            <PeriodKpi
              icon={UtensilsCrossed}
              accent="#9A5B3F"
              label="Promedio por evento"
              value={`${avgPerEvent.toLocaleString("es-MX")}`}
              sub="personas / evento atendido"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Por tipo de evento */}
            <div className="space-y-3">
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.62rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-3)" }}>
                Por tipo de evento
              </p>
              <div className="space-y-2.5">
                {byType.map((t, i) => {
                  const color = TYPE_COLORS[i % TYPE_COLORS.length]
                  return (
                    <div key={t.type} className="space-y-1">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="h-2.5 w-2.5 rounded-sm shrink-0" style={{ background: color }} />
                          <span className="text-sm font-sans truncate" style={{ color: "var(--text-1)" }}>{t.type}</span>
                          <span className="mono-data shrink-0" style={{ fontSize: "0.68rem", color: "var(--text-3)" }}>
                            {t.count} evento{t.count !== 1 ? "s" : ""}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="mono-data" style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-1)" }}>
                            {t.guests.toLocaleString("es-MX")} pers.
                          </span>
                          <span className="mono-data hidden sm:inline" style={{ fontSize: "0.72rem", color: "var(--text-2)", width: "5.5rem", textAlign: "right" }}>
                            {formatCurrency(t.revenue)}
                          </span>
                        </div>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full" style={{ background: "var(--surface-3, #EBEBEC)" }}>
                        <div className="h-full rounded-full" style={{ width: `${(t.guests / maxTypeGuests) * 100}%`, background: color }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Por mes */}
            <div className="space-y-3">
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.62rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-3)" }}>
                Personas atendidas por mes
              </p>
              {byMonth.length === 0 ? (
                <p className="text-sm font-sans text-muted-foreground py-6 text-center">Sin datos mensuales</p>
              ) : (
                <div className="flex items-end gap-1.5 h-40 pt-2">
                  {byMonth.map((m) => {
                    const h = m.guests > 0 ? Math.max(4, (m.guests / maxMonthGuests) * 100) : 2
                    return (
                      <div key={m.key} className="flex-1 flex flex-col items-center gap-1.5 min-w-0">
                        <span className="mono-data" style={{ fontSize: "0.62rem", color: "var(--text-2)" }}>
                          {m.guests > 0 ? m.guests : ""}
                        </span>
                        <div className="w-full flex items-end" style={{ height: "100%" }}>
                          <div
                            className="w-full rounded-t-sm transition-all"
                            style={{ height: `${h}%`, background: m.guests > 0 ? "#8B6D24" : "var(--surface-3, #EBEBEC)" }}
                            title={`${m.label}: ${m.guests} personas · ${m.count} eventos`}
                          />
                        </div>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-3)" }}>
                          {m.label}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function PeriodKpi({
  icon: Icon, accent, label, value, sub,
}: {
  icon: React.ElementType
  accent: string
  label: string
  value: string
  sub: string
}) {
  const isMoney = value.startsWith("$")
  return (
    <div className="rounded-lg border border-border p-3 space-y-1.5" style={{ borderLeftWidth: "3px", borderLeftColor: accent }}>
      <div className="flex items-center justify-between gap-2">
        <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.58rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-3)" }}>{label}</p>
        <Icon size={13} style={{ color: accent }} />
      </div>
      <p className={isMoney ? "mono-data" : undefined} style={{
        fontFamily: isMoney ? "var(--font-mono)" : "var(--font-display), Georgia, serif",
        fontSize: isMoney ? "1.1rem" : "1.5rem",
        fontWeight: 600,
        lineHeight: 1.05,
        color: "var(--text-1)",
        letterSpacing: isMoney ? "-0.01em" : "-0.02em",
      }}>{value}</p>
      <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.68rem", color: "var(--text-3)", lineHeight: 1.35 }}>{sub}</p>
    </div>
  )
}
