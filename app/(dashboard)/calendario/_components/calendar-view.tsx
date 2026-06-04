"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { ChevronLeft, ChevronRight, CalendarPlus, ArrowRight, Users } from "lucide-react"
import { googleCalendarEventUrl } from "@/lib/utils"
import { PageHeader } from "@/components/layout/page-header"
import type { CalendarEvent } from "../page"

// Identidad del módulo (Agenda → azul pizarra) + colores de etapa
// unificados con el pipeline de Eventos.
const ACCENT = "#3D5A80"
const STATUS_LABEL: Record<string, string> = {
  cotizado: "Cotizado", contratado: "Contratado", en_requisicion: "En requisición",
  en_compras: "En compras", completado: "Completado", cancelado: "Cancelado",
}
const STATUS_COLOR: Record<string, string> = {
  cotizado: "#3D5A80", contratado: "#4C4F8A", en_requisicion: "#2C6E6A",
  en_compras: "#9A5B3F", completado: "#2F6B4F", cancelado: "#991B1B",
}
const soft = (c: string, p = 10) => `color-mix(in srgb, ${c} ${p}%, white)`
const BORDER = "var(--border-def, #EBEBEC)"

type Props = {
  events: CalendarEvent[]
  currentMonth: string // "YYYY-MM"
}

export function CalendarView({ events, currentMonth }: Props) {
  const router = useRouter()
  const [year, mon] = currentMonth.split("-").map(Number)

  const monthLabel = new Date(year, mon - 1, 1).toLocaleDateString("es-MX", { month: "long", year: "numeric" })

  const firstDate = new Date(year, mon - 1, 1)
  const daysInMonth = new Date(year, mon, 0).getDate()
  const startOffset = (firstDate.getDay() + 6) % 7

  const prevDate = new Date(year, mon - 2, 1)
  const nextDate = new Date(year, mon, 1)
  const prevMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}`
  const nextMonth = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, "0")}`

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

  const navBtn = "inline-flex items-center justify-center h-8 rounded-md border border-border bg-card hover:bg-muted transition-colors"

  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        title="Calendario"
        description={events.length > 0
          ? `Control de días y personas · ${events.length} evento${events.length !== 1 ? "s" : ""} · ${totalGuests.toLocaleString("es-MX")} invitados`
          : "Control de días y personas · sin eventos este mes"}
        actions={
          <div className="flex items-center gap-1">
            <Link href={`/calendario?month=${prevMonth}`} className={`${navBtn} w-8`}><ChevronLeft size={15} /></Link>
            <button
              onClick={() => { const n = new Date(); router.push(`/calendario?month=${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}`) }}
              className={`${navBtn} px-3`}
              style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--text-2)", letterSpacing: "0.06em" }}
            >HOY</button>
            <Link href={`/calendario?month=${nextMonth}`} className={`${navBtn} w-8`}><ChevronRight size={15} /></Link>
          </div>
        }
      />

      {/* Etiqueta de mes */}
      <div className="flex items-center gap-3">
        <p style={{ fontFamily: "var(--font-display), Georgia, serif", fontSize: "1.125rem", fontWeight: 600, color: "var(--text-1)", textTransform: "capitalize" }}>
          {monthLabel}
        </p>
        {events.length > 0 && (
          <span style={{
            fontFamily: "var(--font-mono)", fontSize: "0.6rem", color: ACCENT,
            letterSpacing: "0.12em", textTransform: "uppercase",
            background: soft(ACCENT, 11), border: `1px solid ${soft(ACCENT, 28)}`,
            borderRadius: "4px", padding: "0.15rem 0.5rem",
          }}>
            {totalGuests.toLocaleString("es-MX")} inv.
          </span>
        )}
      </div>

      {/* Grid del calendario */}
      <div className="enterprise-card overflow-hidden">
        <div className="grid grid-cols-7 border-b border-border">
          {DAYS_ES.map((d) => (
            <div key={d} style={{
              padding: "0.5rem 0", textAlign: "center", fontFamily: "var(--font-mono)",
              fontSize: "0.6rem", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase",
              color: "var(--text-3)", borderRight: `1px solid ${BORDER}`,
            }} className="last:border-r-0">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {cells.map((day, i) => {
            const isToday = isCurrentMonth && day === todayDay
            const dayEvents = day ? (byDay.get(day) ?? []) : []
            const isWeekend = i % 7 >= 5
            const dayGuests = dayEvents.reduce((s, e) => s + (e.guest_count ?? 0), 0)

            return (
              <div
                key={i}
                style={{
                  minHeight: "120px", padding: "0.5rem",
                  borderRight: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}`,
                  background: !day ? "var(--surface-2, #F4F4F5)" : isWeekend ? "color-mix(in srgb, var(--surface-2, #F4F4F5) 50%, white)" : "transparent",
                }}
                className={`${i % 7 === 6 ? "border-r-0" : ""}`}
              >
                {day && (
                  <>
                    <div className="flex items-start justify-between mb-1.5">
                      <div style={{
                        display: "inline-flex", alignItems: "center", justifyContent: "center",
                        height: "22px", width: "22px", borderRadius: "50%",
                        fontFamily: "var(--font-mono)", fontSize: "0.7rem", fontWeight: 600,
                        background: isToday ? ACCENT : "transparent",
                        color: isToday ? "#fff" : "var(--text-2)",
                      }}>{day}</div>
                      {dayGuests > 0 && (
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", color: "var(--text-3)", letterSpacing: "0.06em", lineHeight: 1, paddingTop: "0.35rem" }}>
                          {dayGuests}
                        </span>
                      )}
                    </div>

                    <div className="space-y-0.5">
                      {dayEvents.slice(0, 3).map((ev) => {
                        const c = STATUS_COLOR[ev.status] ?? "var(--text-3)"
                        return (
                          <div key={ev.id} className="flex items-center gap-1 rounded px-1 py-0.5 border group relative"
                            style={{ background: soft(c, 9), borderColor: soft(c, 26) }}>
                            <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: c }} />
                            <Link href={`/eventos/${ev.id}`} className="flex-1 truncate hover:opacity-80 transition-opacity"
                              style={{ fontFamily: "var(--font-sans)", fontSize: "0.65rem", lineHeight: 1.3, color: c }}
                              title={`${ev.name}${ev.clients?.name ? ` · ${ev.clients.name}` : ""}${ev.guest_count ? ` · ${ev.guest_count} inv.` : ""}`}>
                              {ev.name}
                            </Link>
                            <a href={gcalUrl(ev)} target="_blank" rel="noopener noreferrer" title="Agregar a Google Calendar"
                              className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              style={{ color: c }} onClick={(e) => e.stopPropagation()}>
                              <CalendarPlus size={10} />
                            </a>
                          </div>
                        )
                      })}
                      {dayEvents.length > 3 && (
                        <Link href={`/eventos?date=${year}-${String(mon).padStart(2, "0")}-${String(day).padStart(2, "0")}`}
                          style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", color: ACCENT, letterSpacing: "0.06em" }}
                          className="block px-1 hover:opacity-80">
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

      {/* Leyenda de estado */}
      <div className="flex items-center gap-4 flex-wrap">
        <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-3)" }}>Estado:</p>
        {Object.entries(STATUS_LABEL).filter(([k]) => k !== "cancelado").map(([key, label]) => (
          <div key={key} className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ background: STATUS_COLOR[key] ?? "var(--text-3)" }} />
            <span style={{ fontFamily: "var(--font-sans)", fontSize: "0.7rem", color: "var(--text-3)" }}>{label}</span>
          </div>
        ))}
      </div>

      {/* Lista de eventos del mes */}
      {events.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div style={{ flex: 1, height: "1px", background: BORDER }} />
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--text-3)" }}>Eventos del mes</span>
            <div style={{ flex: 1, height: "1px", background: BORDER }} />
          </div>

          <div className="enterprise-card overflow-hidden divide-y divide-border">
            {events.map((ev) => {
              const d = new Date(ev.event_date + "T12:00:00")
              const c = STATUS_COLOR[ev.status] ?? "var(--text-3)"
              return (
                <div key={ev.id} className="flex items-center gap-4 px-4 py-3 table-row-hover">
                  <div className="w-10 shrink-0 text-center">
                    <p className="mono-data" style={{ fontSize: "1.125rem", fontWeight: 600, color: "var(--text-1)", lineHeight: 1 }}>{d.getDate()}</p>
                    <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.52rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-3)", marginTop: "0.2rem" }}>
                      {d.toLocaleDateString("es-MX", { month: "short" }).replace(".", "")}
                    </p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate" style={{ fontFamily: "var(--font-display), Georgia, serif", fontSize: "0.9375rem", fontWeight: 500, color: "var(--text-1)" }}>{ev.name}</p>
                    <p className="truncate mt-0.5" style={{ fontFamily: "var(--font-sans)", fontSize: "0.7rem", color: "var(--text-2)" }}>
                      {ev.clients?.name ?? "Sin cliente"}{ev.location ? ` · ${ev.location}` : ""}
                    </p>
                  </div>
                  {ev.guest_count > 0 && (
                    <div className="hidden sm:flex items-center gap-1 shrink-0">
                      <Users size={11} style={{ color: "var(--text-3)" }} />
                      <span className="mono-data" style={{ fontSize: "0.75rem", color: "var(--text-2)" }}>{ev.guest_count.toLocaleString("es-MX")}</span>
                    </div>
                  )}
                  <span className="status-pill hidden sm:inline-flex" style={{ color: c, background: soft(c, 10), borderColor: soft(c, 26) }}>
                    <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: c }} />
                    {STATUS_LABEL[ev.status] ?? ev.status}
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    <a href={gcalUrl(ev)} target="_blank" rel="noopener noreferrer" title="Agregar a Google Calendar"
                      className="inline-flex items-center gap-1.5 rounded px-2 py-1 border transition-colors"
                      style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.06em", color: ACCENT, borderColor: soft(ACCENT, 28), background: soft(ACCENT, 7) }}>
                      <CalendarPlus size={11} />
                      <span className="hidden md:inline">GCal</span>
                    </a>
                    <Link href={`/eventos/${ev.id}`} className="inline-flex items-center justify-center h-7 w-7 rounded border border-border hover:border-gold/40 transition-colors" title="Ver evento" style={{ color: "var(--text-3)" }}>
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
          <div style={{ color: "var(--text-3)", opacity: 0.4 }}><CalendarPlus size={32} /></div>
          <p style={{ fontFamily: "var(--font-display), Georgia, serif", fontSize: "1rem", fontWeight: 500, color: "var(--text-2)" }}>Sin eventos este mes</p>
          <Link href="/eventos" style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", letterSpacing: "0.1em", color: ACCENT, textTransform: "uppercase" }}>Crear evento →</Link>
        </div>
      )}
    </div>
  )
}
