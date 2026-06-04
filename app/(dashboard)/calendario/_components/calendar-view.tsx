"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { ChevronLeft, ChevronRight, CalendarPlus, ArrowRight, Users } from "lucide-react"
import { googleCalendarEventUrl } from "@/lib/utils"
import type { CalendarEvent } from "../page"

const STATUS_LABEL: Record<string, string> = {
  cotizado:       "Cotizado",
  contratado:     "Contratado",
  en_requisicion: "En requisición",
  en_compras:     "En compras",
  completado:     "Completado",
  cancelado:      "Cancelado",
}

// Colores semánticos — referencian CSS custom properties del nuevo sistema cálido
const STATUS_COLORS: Record<string, { color: string; bg: string; border: string }> = {
  cotizado:       { color: "var(--status-info)",    bg: "rgb(107 155 189 / 0.10)", border: "rgb(107 155 189 / 0.22)" },
  contratado:     { color: "var(--status-active)",  bg: "rgb(82 182 138 / 0.10)",  border: "rgb(82 182 138 / 0.22)"  },
  en_requisicion: { color: "var(--amber)",          bg: "rgb(212 149 43 / 0.10)",  border: "rgb(212 149 43 / 0.22)"  },
  en_compras:     { color: "#E8823A",               bg: "rgb(232 130 58 / 0.10)",  border: "rgb(232 130 58 / 0.22)"  },
  completado:     { color: "var(--status-done)",    bg: "rgb(82 147 107 / 0.10)",  border: "rgb(82 147 107 / 0.22)"  },
  cancelado:      { color: "var(--status-danger)",  bg: "rgb(192 88 69 / 0.10)",   border: "rgb(192 88 69 / 0.22)"   },
}


type Props = {
  events: CalendarEvent[]
  currentMonth: string   // "YYYY-MM"
}

export function CalendarView({ events, currentMonth }: Props) {
  const router = useRouter()
  const [year, mon] = currentMonth.split("-").map(Number)

  const monthLabel = new Date(year, mon - 1, 1).toLocaleDateString("es-MX", {
    month: "long", year: "numeric",
  })

  // Build grid: Monday-first (Mon=0…Sun=6)
  const firstDate  = new Date(year, mon - 1, 1)
  const daysInMonth = new Date(year, mon, 0).getDate()
  const startOffset = (firstDate.getDay() + 6) % 7

  // Prev / next month links
  const prevDate  = new Date(year, mon - 2, 1)
  const nextDate  = new Date(year, mon, 1)
  const prevMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}`
  const nextMonth = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, "0")}`

  // Group events by day
  const byDay = new Map<number, CalendarEvent[]>()
  for (const ev of events) {
    const d = parseInt(ev.event_date.split("-")[2], 10)
    if (!byDay.has(d)) byDay.set(d, [])
    byDay.get(d)!.push(ev)
  }

  const today = new Date()
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() + 1 === mon
  const todayDay = today.getDate()

  const DAYS_ES = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]

  const totalCells = Math.ceil((startOffset + daysInMonth) / 7) * 7
  const cells = Array.from({ length: totalCells }, (_, i) => {
    const dayNum = i - startOffset + 1
    return dayNum >= 1 && dayNum <= daysInMonth ? dayNum : null
  })

  // Month totals
  const totalGuests = events.reduce((s, e) => s + (e.guest_count ?? 0), 0)

  function gcalUrl(ev: CalendarEvent) {
    return googleCalendarEventUrl({
      title: ev.name,
      startDate: ev.event_date,
      startTime: ev.event_time ?? undefined,
      location: ev.location ?? undefined,
      details: `Cliente: ${ev.clients?.name ?? "—"}\nInvitados: ${ev.guest_count}\nEstado: ${STATUS_LABEL[ev.status] ?? ev.status}`,
    })
  }

  return (
    <div className="space-y-6 pb-10">

      {/* ── Page header ───────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-end gap-4 justify-between">
        <div>
          <h1 style={{
            fontFamily: "var(--font-display), Georgia, serif",
            fontSize: "1.75rem", fontWeight: 700,
            color: "var(--text-1)", letterSpacing: "-0.02em",
          }}>
            Calendario
          </h1>
          <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.8125rem", color: "var(--text-2)", marginTop: "0.2rem" }}>
            Control de días y personas · {events.length > 0
              ? `${events.length} evento${events.length !== 1 ? "s" : ""} · ${totalGuests.toLocaleString("es-MX")} invitados`
              : "Sin eventos este mes"}
          </p>
        </div>

        {/* Month navigation */}
        <div className="flex items-center gap-1 shrink-0">
          <Link
            href={`/calendario?month=${prevMonth}`}
            className="inline-flex items-center justify-center h-8 w-8 rounded-md border border-border bg-card hover:bg-muted hover:border-gold/40 transition-colors"
          >
            <ChevronLeft size={15} />
          </Link>
          <button
            onClick={() => {
              const n = new Date()
              router.push(`/calendario?month=${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}`)
            }}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-border bg-card hover:bg-muted hover:border-gold/40 transition-colors"
            style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--text-2)", letterSpacing: "0.06em" }}
          >
            HOY
          </button>
          <Link
            href={`/calendario?month=${nextMonth}`}
            className="inline-flex items-center justify-center h-8 w-8 rounded-md border border-border bg-card hover:bg-muted hover:border-gold/40 transition-colors"
          >
            <ChevronRight size={15} />
          </Link>
        </div>
      </div>

      {/* ── Month label ───────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <p style={{
          fontFamily: "var(--font-display), Georgia, serif",
          fontSize: "1.125rem", fontWeight: 600,
          color: "var(--text-1)", letterSpacing: "0.01em",
          textTransform: "capitalize",
        }}>
          {monthLabel}
        </p>
        {events.length > 0 && (
          <span style={{
            fontFamily: "var(--font-mono)", fontSize: "0.6rem",
            color: "var(--amber)", letterSpacing: "0.12em",
            textTransform: "uppercase",
            background: "rgb(232 162 39 / 0.1)",
            border: "1px solid rgb(232 162 39 / 0.2)",
            borderRadius: "4px", padding: "0.15rem 0.5rem",
          }}>
            {totalGuests.toLocaleString("es-MX")} inv.
          </span>
        )}
      </div>

      {/* ── Calendar grid ─────────────────────────────────────── */}
      <div className="enterprise-card overflow-hidden">
        {/* Day-of-week headers */}
        <div className="grid grid-cols-7 border-b border-border">
          {DAYS_ES.map((d) => (
            <div key={d} style={{
              padding: "0.5rem 0",
              textAlign: "center",
              fontFamily: "var(--font-mono)",
              fontSize: "0.6rem",
              fontWeight: 600,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--text-3)",
              borderRight: "1px solid var(--border-dim)",
            }}
              className="last:border-r-0"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7">
          {cells.map((day, i) => {
            const isToday   = isCurrentMonth && day === todayDay
            const dayEvents = day ? (byDay.get(day) ?? []) : []
            const isWeekend = i % 7 >= 5
            const dayGuests = dayEvents.reduce((s, e) => s + (e.guest_count ?? 0), 0)

            return (
              <div
                key={i}
                style={{
                  minHeight: "120px",
                  padding: "0.5rem",
                  borderRight: "1px solid var(--border-dim)",
                  borderBottom: "1px solid var(--border-dim)",
                  background: !day
                    ? "rgb(255 255 255 / 0.01)"
                    : isWeekend
                    ? "rgb(255 255 255 / 0.01)"
                    : "transparent",
                }}
                className={`${i % 7 === 6 ? "border-r-0" : ""}`}
              >
                {day && (
                  <>
                    {/* Day number + guest total */}
                    <div className="flex items-start justify-between mb-1.5">
                      <div
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          height: "22px",
                          width: "22px",
                          borderRadius: "50%",
                          fontFamily: "var(--font-mono)",
                          fontSize: "0.7rem",
                          fontWeight: 600,
                          background: isToday ? "var(--amber)" : "transparent",
                          color: isToday ? "#0C0C0A" : "var(--text-2)",
                        }}
                      >
                        {day}
                      </div>
                      {dayGuests > 0 && (
                        <span style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: "0.55rem",
                          color: "var(--text-3)",
                          letterSpacing: "0.06em",
                          lineHeight: 1,
                          paddingTop: "0.35rem",
                        }}>
                          {dayGuests}
                        </span>
                      )}
                    </div>

                    {/* Event pills */}
                    <div className="space-y-0.5">
                      {dayEvents.slice(0, 3).map((ev) => {
                        const sc = STATUS_COLORS[ev.status] ?? { color: "var(--text-3)", bg: "rgb(255 255 255 / 0.03)", border: "var(--border-def)" }
                        return (
                          <div
                            key={ev.id}
                            className="flex items-center gap-1 rounded px-1 py-0.5 border group relative"
                            style={{ background: sc.bg, borderColor: sc.border }}
                          >
                            <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: sc.color }} />
                            <Link
                              href={`/eventos/${ev.id}`}
                              className="flex-1 truncate hover:opacity-80 transition-opacity"
                              style={{ fontFamily: "var(--font-sans)", fontSize: "0.65rem", lineHeight: 1.3, color: sc.color }}
                              title={`${ev.name}${ev.clients?.name ? ` · ${ev.clients.name}` : ""}${ev.guest_count ? ` · ${ev.guest_count} inv.` : ""}`}
                            >
                              {ev.name}
                            </Link>
                            <a
                              href={gcalUrl(ev)}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Agregar a Google Calendar"
                              className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              style={{ color: "var(--amber)" }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <CalendarPlus size={10} />
                            </a>
                          </div>
                        )
                      })}
                      {dayEvents.length > 3 && (
                        <Link
                          href={`/eventos?date=${year}-${String(mon).padStart(2,"0")}-${String(day).padStart(2,"0")}`}
                          style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", color: "var(--amber)", letterSpacing: "0.06em" }}
                          className="block px-1 hover:opacity-80"
                        >
                          +{dayEvents.length - 3} más
                        </Link>
                      )}
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Status legend ─────────────────────────────────────── */}
      <div className="flex items-center gap-4 flex-wrap">
        <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-3)" }}>
          Estado:
        </p>
        {Object.entries(STATUS_LABEL).filter(([k]) => k !== "cancelado").map(([key, label]) => {
          const sc = STATUS_COLORS[key]
          return (
            <div key={key} className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ background: sc?.color ?? "var(--text-3)" }} />
              <span style={{ fontFamily: "var(--font-sans)", fontSize: "0.7rem", color: "var(--text-3)" }}>{label}</span>
            </div>
          )
        })}
      </div>

      {/* ── Monthly event list ────────────────────────────────── */}
      {events.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div style={{ flex: 1, height: "1px", background: "var(--border-dim)" }} />
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--text-3)" }}>
              Eventos del mes
            </span>
            <div style={{ flex: 1, height: "1px", background: "var(--border-dim)" }} />
          </div>

          <div className="enterprise-card overflow-hidden divide-y divide-border">
            {events.map((ev) => {
              const d = new Date(ev.event_date + "T12:00:00")
              const sc = STATUS_COLORS[ev.status] ?? { color: "var(--text-3)", bg: "rgb(255 255 255 / 0.03)", border: "var(--border-def)" }
              return (
                <div key={ev.id} className="flex items-center gap-4 px-4 py-3 table-row-hover">

                  {/* Date stamp */}
                  <div className="w-10 shrink-0 text-center">
                    <p className="mono-data" style={{ fontSize: "1.125rem", fontWeight: 600, color: "var(--text-1)", lineHeight: 1 }}>
                      {d.getDate()}
                    </p>
                    <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.52rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-3)", marginTop: "0.2rem" }}>
                      {d.toLocaleDateString("es-MX", { month: "short" })}
                    </p>
                  </div>

                  {/* Event info */}
                  <div className="flex-1 min-w-0">
                    <p className="truncate" style={{ fontFamily: "var(--font-display), Georgia, serif", fontSize: "0.9375rem", fontWeight: 500, color: "var(--text-1)", letterSpacing: "0.01em" }}>
                      {ev.name}
                    </p>
                    <p className="truncate mt-0.5" style={{ fontFamily: "var(--font-sans)", fontSize: "0.7rem", color: "var(--text-2)" }}>
                      {ev.clients?.name ?? "Sin cliente"}
                      {ev.location ? ` · ${ev.location}` : ""}
                    </p>
                  </div>

                  {/* Guests */}
                  {ev.guest_count > 0 && (
                    <div className="hidden sm:flex items-center gap-1 shrink-0">
                      <Users size={11} style={{ color: "var(--text-3)" }} />
                      <span className="mono-data" style={{ fontSize: "0.75rem", color: "var(--text-2)" }}>
                        {ev.guest_count.toLocaleString("es-MX")}
                      </span>
                    </div>
                  )}

                  {/* Status pill */}
                  {(() => {
                    const sc = STATUS_COLORS[ev.status]
                    return sc ? (
                      <span className="status-pill hidden sm:inline-flex" style={{ color: sc.color, background: sc.bg, borderColor: sc.border }}>
                        <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: sc.color }} />
                        {STATUS_LABEL[ev.status] ?? ev.status}
                      </span>
                    ) : null
                  })()}

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      href={gcalUrl(ev)}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Agregar a Google Calendar"
                      className="inline-flex items-center gap-1.5 rounded px-2 py-1 border transition-colors hover:border-amber-400/40"
                      style={{
                        fontFamily: "var(--font-mono)", fontSize: "0.6rem",
                        letterSpacing: "0.06em", color: "var(--amber)",
                        borderColor: "rgb(232 162 39 / 0.2)",
                        background: "rgb(232 162 39 / 0.05)",
                      }}
                    >
                      <CalendarPlus size={11} />
                      <span className="hidden md:inline">GCal</span>
                    </a>
                    <Link
                      href={`/eventos/${ev.id}`}
                      className="inline-flex items-center justify-center h-7 w-7 rounded border border-border hover:border-gold/40 transition-colors"
                      title="Ver evento"
                      style={{ color: "var(--text-3)" }}
                    >
                      <ArrowRight size={13} />
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {events.length === 0 && (
        <div className="enterprise-card flex flex-col items-center justify-center py-16 gap-3">
          <div style={{ color: "var(--text-3)", opacity: 0.4 }}>
            <CalendarPlus size={32} />
          </div>
          <p style={{ fontFamily: "var(--font-display), Georgia, serif", fontSize: "1rem", fontWeight: 500, color: "var(--text-2)" }}>
            Sin eventos este mes
          </p>
          <Link href="/eventos" style={{
            fontFamily: "var(--font-mono)", fontSize: "0.65rem",
            letterSpacing: "0.1em", color: "var(--amber)",
            textTransform: "uppercase",
          }}>
            Crear evento →
          </Link>
        </div>
      )}
    </div>
  )
}
